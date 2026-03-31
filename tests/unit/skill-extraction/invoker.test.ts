import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import {
  spawnAsync,
  invokeSkillExtraction,
  describeExtractionSkip,
} from "../../../src/skill-extraction/invoker.js";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock child_process.spawn
const mockSpawn = vi.fn();
vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
}));

// Mock scanner to avoid real FS access
vi.mock("../../../src/project-types/scanner.js", () => ({
  getWorkspacePackageDirs: vi.fn(() => []),
}));

// ---------------------------------------------------------------------------
// Helpers: fake child process
// ---------------------------------------------------------------------------

interface FakeChildProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: ReturnType<typeof vi.fn>;
}

function createFakeChild(): FakeChildProcess {
  const child = new EventEmitter() as FakeChildProcess;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = vi.fn();
  return child;
}

function emitClose(child: FakeChildProcess, code: number | null): void {
  child.emit("close", code);
}

function emitData(stream: EventEmitter, data: string): void {
  stream.emit("data", Buffer.from(data));
}

// ---------------------------------------------------------------------------
// spawnAsync unit tests
// ---------------------------------------------------------------------------

describe("spawnAsync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSpawn.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("collects stdout and returns success on exit code 0", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = spawnAsync("echo", ["hello"], { cwd: "/tmp" });

    emitData(child.stdout, "hello world\n");
    emitClose(child, 0);

    const result = await promise;
    expect(result.success).toBe(true);
    expect(result.stdout).toBe("hello world\n");
    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(result.failureReason).toBeUndefined();

    // Verify spawn was called without shell: true
    expect(mockSpawn).toHaveBeenCalledWith(
      "echo",
      ["hello"],
      expect.objectContaining({
        cwd: "/tmp",
        stdio: ["pipe", "pipe", "pipe"],
      }),
    );
    // Ensure shell option is NOT set to true
    const spawnOptions = mockSpawn.mock.calls[0][2] as Record<string, unknown>;
    expect(spawnOptions.shell).toBeUndefined();
  });

  it("collects stderr and returns failure on non-zero exit code", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = spawnAsync("some-cmd", ["--fail"], { cwd: "/tmp" });

    emitData(child.stderr, "Error: something failed\n");
    emitData(child.stdout, "partial output\n");
    emitClose(child, 1);

    const result = await promise;
    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("Error: something failed\n");
    expect(result.stdout).toBe("partial output\n");
    expect(result.failureReason).toBeUndefined();
  });

  it("kills child process and returns timeout on timeout", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = spawnAsync("slow-cmd", [], {
      cwd: "/tmp",
      timeoutMs: 1000,
    });

    // Advance past timeout
    vi.advanceTimersByTime(1001);

    const result = await promise;
    expect(result.success).toBe(false);
    expect(result.failureReason).toBe("timeout");
    expect(child.kill).toHaveBeenCalledWith("SIGTERM");
  });

  it("kills child process when AbortSignal is aborted", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const controller = new AbortController();
    const promise = spawnAsync("long-cmd", [], {
      cwd: "/tmp",
      timeoutMs: 60_000,
      signal: controller.signal,
    });

    // Abort before timeout
    controller.abort();

    const result = await promise;
    expect(result.success).toBe(false);
    expect(result.failureReason).toBe("signal");
    expect(child.kill).toHaveBeenCalledWith("SIGTERM");
  });

  it("immediately fails if AbortSignal is already aborted", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const controller = new AbortController();
    controller.abort();

    const promise = spawnAsync("cmd", [], {
      cwd: "/tmp",
      signal: controller.signal,
    });

    const result = await promise;
    expect(result.success).toBe(false);
    expect(result.failureReason).toBe("signal");
    expect(child.kill).toHaveBeenCalledWith("SIGTERM");
  });

  it("handles spawn error event", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = spawnAsync("nonexistent-cmd", [], { cwd: "/tmp" });

    child.emit("error", new Error("ENOENT: command not found"));

    const result = await promise;
    expect(result.success).toBe(false);
    expect(result.stderr).toContain("Spawn error: ENOENT");
    expect(result.exitCode).toBeNull();
  });

  it("cleans up timeout after process exits normally", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = spawnAsync("fast-cmd", [], {
      cwd: "/tmp",
      timeoutMs: 5000,
    });

    emitClose(child, 0);
    const result = await promise;

    // Advance well past timeout — should not cause double-resolve
    vi.advanceTimersByTime(10_000);

    expect(result.success).toBe(true);
    expect(result.failureReason).toBeUndefined();
  });

  it("merges env with process.env and passes FORCE_COLOR", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = spawnAsync("cmd", ["arg"], {
      cwd: "/tmp",
      env: { FORCE_COLOR: "0", MY_VAR: "test" },
    });

    emitClose(child, 0);
    await promise;

    const spawnOpts = mockSpawn.mock.calls[0][2] as Record<string, unknown>;
    const env = spawnOpts.env as Record<string, string | undefined>;
    expect(env.FORCE_COLOR).toBe("0");
    expect(env.MY_VAR).toBe("test");
  });
});

// ---------------------------------------------------------------------------
// Command injection prevention (D2)
// ---------------------------------------------------------------------------

describe("command injection prevention", () => {
  beforeEach(() => {
    mockSpawn.mockReset();
  });

  it("passes arguments as array, not as shell string", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    // Simulate a malicious prompt that tries shell injection
    const maliciousPrompt = "hello'; rm -rf / ; echo '";

    const promise = spawnAsync("echo", [maliciousPrompt], { cwd: "/tmp" });
    emitClose(child, 0);
    await promise;

    // Verify spawn received args as array, not as a single shell command
    expect(mockSpawn).toHaveBeenCalledWith(
      "echo",
      [maliciousPrompt],
      expect.anything(),
    );

    // The malicious content should be treated as a literal argument
    const args = mockSpawn.mock.calls[0][1] as string[];
    expect(args[0]).toBe(maliciousPrompt);
    // No shell option set
    const opts = mockSpawn.mock.calls[0][2] as Record<string, unknown>;
    expect(opts.shell).toBeUndefined();
  });

  it("invokeSkillExtraction uses spawn with args array, not shell", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    // First call: isToolInstalledAsync check (claude --version)
    // Second call: actual extraction (claude -p <prompt>)
    const promise = invokeSkillExtraction("/tmp", ["claude-code"]);

    // Resolve the --version check
    emitClose(child, 0);

    // Wait a tick for the async flow to proceed to extraction
    await vi.waitFor(() => {
      expect(mockSpawn.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    // Resolve the extraction call
    emitData(child.stdout, "skills extracted");
    emitClose(child, 0);

    const result = await promise;

    // Verify all spawn calls used array args (not shell strings)
    for (const call of mockSpawn.mock.calls) {
      const bin = call[0] as string;
      const args = call[1] as string[];
      expect(typeof bin).toBe("string");
      expect(Array.isArray(args)).toBe(true);
      const opts = call[2] as Record<string, unknown>;
      expect(opts.shell).toBeUndefined();
    }

    expect(result.success).toBe(true);
    expect(result.tool).toBe("claude-code");
  });
});

// ---------------------------------------------------------------------------
// invokeSkillExtraction integration-style tests
// ---------------------------------------------------------------------------

describe("invokeSkillExtraction", () => {
  beforeEach(() => {
    mockSpawn.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns success when claude-code extraction succeeds", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = invokeSkillExtraction("/project", ["claude-code"]);

    // First spawn: isToolInstalledAsync (claude --version)
    emitClose(child, 0);

    await vi.waitFor(() => expect(mockSpawn.mock.calls.length).toBeGreaterThanOrEqual(2));

    // Second spawn: extraction (claude -p ...)
    emitData(child.stdout, "Created skill: typescript-conventions");
    emitClose(child, 0);

    const result = await promise;
    expect(result.tool).toBe("claude-code");
    expect(result.success).toBe(true);
    expect(result.output).toContain("Created skill");
    expect(result.skipped).toEqual([]);
  });

  it("falls back to codex when claude-code is not installed", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = invokeSkillExtraction("/project", ["claude-code", "codex"]);

    // First spawn: claude --version -> fails (not installed)
    emitClose(child, 1);

    await vi.waitFor(() => expect(mockSpawn.mock.calls.length).toBeGreaterThanOrEqual(2));

    // Second spawn: codex --version -> succeeds
    emitClose(child, 0);

    await vi.waitFor(() => expect(mockSpawn.mock.calls.length).toBeGreaterThanOrEqual(3));

    // Third spawn: codex exec <prompt>
    emitData(child.stdout, "Codex extracted skills");
    emitClose(child, 0);

    const result = await promise;
    expect(result.tool).toBe("codex");
    expect(result.success).toBe(true);
    expect(result.skipped.length).toBe(1); // claude-code cli-not-installed
    expect(result.skipped[0].reason).toBe("cli-not-installed");
  });

  it("skips tools not in priority list", async () => {
    const promise = invokeSkillExtraction("/project", ["cursor", "copilot"]);

    const result = await promise;
    expect(result.tool).toBeNull();
    expect(result.success).toBe(false);
    expect(result.skipped.length).toBe(2);
    expect(result.skipped[0].reason).toBe("extraction-not-supported");
    expect(result.skipped[1].reason).toBe("extraction-not-supported");
  });

  it("skips tools not in user-provided list", async () => {
    // opencode is in PRIORITY but not in userTools
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = invokeSkillExtraction("/project", ["claude-code"]);

    // claude --version -> succeeds
    emitClose(child, 0);

    await vi.waitFor(() => expect(mockSpawn.mock.calls.length).toBeGreaterThanOrEqual(2));

    // claude -p ... -> succeeds
    emitData(child.stdout, "done");
    emitClose(child, 0);

    const result = await promise;
    expect(result.tool).toBe("claude-code");
    expect(result.success).toBe(true);
  });

  it("returns failure when extraction process exits non-zero", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = invokeSkillExtraction("/project", ["claude-code"]);

    // claude --version -> succeeds
    emitClose(child, 0);

    await vi.waitFor(() => expect(mockSpawn.mock.calls.length).toBeGreaterThanOrEqual(2));

    // claude -p ... -> fails
    emitData(child.stderr, "API rate limit exceeded");
    emitClose(child, 1);

    const result = await promise;
    expect(result.tool).toBe("claude-code");
    expect(result.success).toBe(false);
    expect(result.output).toContain("API rate limit exceeded");
  });

  it("returns timeout message when extraction times out", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = invokeSkillExtraction("/project", ["claude-code"]);

    // claude --version -> succeeds
    emitClose(child, 0);

    await vi.waitFor(() => expect(mockSpawn.mock.calls.length).toBeGreaterThanOrEqual(2));

    // claude -p ... -> hangs, trigger timeout
    vi.advanceTimersByTime(300_001);

    const result = await promise;
    expect(result.tool).toBe("claude-code");
    expect(result.success).toBe(false);
    expect(result.output).toContain("[TIMEOUT]");
  });

  it("respects AbortSignal from caller", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);
    const controller = new AbortController();

    const promise = invokeSkillExtraction("/project", ["claude-code"], {
      signal: controller.signal,
    });

    // claude --version -> succeeds
    emitClose(child, 0);

    await vi.waitFor(() => expect(mockSpawn.mock.calls.length).toBeGreaterThanOrEqual(2));

    // Abort during extraction
    controller.abort();

    const result = await promise;
    expect(result.tool).toBe("claude-code");
    expect(result.success).toBe(false);
    expect(child.kill).toHaveBeenCalledWith("SIGTERM");
  });

  it("returns no-usable-tool when all tools are unavailable", async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = invokeSkillExtraction("/project", ["claude-code"]);

    // claude --version -> not installed
    emitClose(child, 1);

    const result = await promise;
    expect(result.tool).toBeNull();
    expect(result.success).toBe(false);
    expect(result.output).toContain("No usable AI tool found");
  });
});

// ---------------------------------------------------------------------------
// describeExtractionSkip
// ---------------------------------------------------------------------------

describe("describeExtractionSkip", () => {
  it("describes extraction-not-supported", () => {
    const msg = describeExtractionSkip({
      tool: "cursor",
      reason: "extraction-not-supported",
    });
    expect(msg).toContain("no automated CLI");
  });

  it("describes cli-not-installed with detail", () => {
    const msg = describeExtractionSkip({
      tool: "codex",
      reason: "cli-not-installed",
      detail: "codex",
    });
    expect(msg).toContain("CLI not in PATH");
    expect(msg).toContain("codex");
  });

  it("describes not-in-user-tools with default detail", () => {
    const msg = describeExtractionSkip({
      tool: "trae",
      reason: "not-in-user-tools",
    });
    expect(msg).toContain("not in the automated extraction priority list");
  });
});
