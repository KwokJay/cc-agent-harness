import { spawn } from "node:child_process";
import type { ToolId } from "../tool-adapters/types.js";
import { getWorkspacePackageDirs } from "../project-types/scanner.js";

const TOOL_PRIORITY: ToolId[] = ["claude-code", "codex", "cursor", "copilot", "opencode"];
const PRIORITY_SET = new Set<ToolId>(TOOL_PRIORITY);

/** Default timeout for skill extraction subprocesses (5 minutes). */
const DEFAULT_EXTRACTION_TIMEOUT_MS = 300_000;

/** Why automated extraction did not run for a tool. */
export type ExtractionSkipReason =
  | "extraction-not-supported"
  | "cli-not-installed"
  | "not-in-user-tools";

export interface ExtractionSkipped {
  tool: ToolId;
  reason: ExtractionSkipReason;
  /** Extra context (e.g. expected binary name). */
  detail?: string;
}

interface InvokeResult {
  tool: ToolId | null;
  success: boolean;
  output: string;
  skipped: ExtractionSkipped[];
}

/** Result from the async spawn wrapper. */
export interface SpawnResult {
  success: boolean;
  /** "timeout" when the process was killed due to timeout. */
  failureReason?: "timeout" | "signal";
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

/** Options for the async spawn wrapper. */
export interface SpawnOptions {
  cwd: string;
  timeoutMs?: number;
  signal?: AbortSignal;
  env?: Record<string, string | undefined>;
}

/** Human-readable line for console / logs. */
export function describeExtractionSkip(s: ExtractionSkipped): string {
  switch (s.reason) {
    case "extraction-not-supported":
      return "no automated CLI for this tool — use manual step in .harness/skills/EXTRACTION-TASK.md or pick Claude Code / Codex in priority list";
    case "cli-not-installed":
      return `CLI not in PATH (expected: ${s.detail ?? "see docs"}) — install the vendor CLI or use manual extraction`;
    case "not-in-user-tools":
      return s.detail ?? "tool is not in the automated extraction priority list";
    default:
      return s.reason;
  }
}

/**
 * Spawn a command asynchronously, collecting stdout/stderr as strings.
 * Supports AbortSignal cancellation and timeout.
 *
 * Uses `args[]` array form (no shell: true) to prevent command injection.
 */
export function spawnAsync(
  command: string,
  args: string[],
  options: SpawnOptions,
): Promise<SpawnResult> {
  const { cwd, timeoutMs = DEFAULT_EXTRACTION_TIMEOUT_MS, signal, env } = options;

  return new Promise<SpawnResult>((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, ...env },
      // Intentionally NOT setting shell: true to avoid command injection.
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finalize = (result: SpawnResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    // --- Timeout handling ---
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      finalize({
        success: false,
        failureReason: "timeout",
        stdout,
        stderr,
        exitCode: null,
      });
    }, timeoutMs);

    // --- AbortSignal handling ---
    let onAbort: (() => void) | null = null;
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timer);
        child.kill("SIGTERM");
        finalize({
          success: false,
          failureReason: "signal",
          stdout,
          stderr,
          exitCode: null,
        });
        return;
      }
      onAbort = () => {
        clearTimeout(timer);
        child.kill("SIGTERM");
        finalize({
          success: false,
          failureReason: "signal",
          stdout,
          stderr,
          exitCode: null,
        });
      };
      signal.addEventListener("abort", onAbort, { once: true });
    }

    // --- Stream collection ---
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    // --- Process exit ---
    child.on("close", (code) => {
      clearTimeout(timer);
      if (onAbort && signal) {
        signal.removeEventListener("abort", onAbort);
      }
      finalize({
        success: code === 0,
        stdout,
        stderr,
        exitCode: code,
      });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      if (onAbort && signal) {
        signal.removeEventListener("abort", onAbort);
      }
      stderr += `\nSpawn error: ${err.message}`;
      finalize({
        success: false,
        stdout,
        stderr,
        exitCode: null,
      });
    });
  });
}

/**
 * Check whether a CLI binary is installed on the system.
 * Uses `spawn` with args array (no shell) to avoid injection.
 */
export async function isToolInstalledAsync(tool: ToolId): Promise<boolean> {
  const bin = getBinName(tool);
  if (!bin) return false;

  try {
    const result = await spawnAsync(bin, ["--version"], {
      cwd: process.cwd(),
      timeoutMs: 5_000,
    });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Run automated skill extraction using available AI CLI tools.
 *
 * Iterates through the priority list of tools, skipping those not in the
 * user's selected list or not installed. Executes the first available tool
 * asynchronously with timeout and optional AbortSignal support.
 */
export async function invokeSkillExtraction(
  cwd: string,
  userTools: ToolId[],
  options?: { signal?: AbortSignal },
): Promise<InvokeResult> {
  const skipped: ExtractionSkipped[] = [];

  for (const tool of userTools) {
    if (!PRIORITY_SET.has(tool)) {
      skipped.push({
        tool,
        reason: "not-in-user-tools",
        detail: "not in automated extraction priority (claude-code, codex, cursor, copilot, opencode)",
      });
    }
  }

  for (const tool of TOOL_PRIORITY) {
    if (!userTools.includes(tool)) continue;

    const cmd = buildExtractionArgs(tool, cwd);
    if (!cmd) {
      skipped.push({ tool, reason: "extraction-not-supported" });
      continue;
    }

    const installed = await isToolInstalledAsync(tool);
    if (!installed) {
      const bin = getBinName(tool);
      skipped.push({
        tool,
        reason: "cli-not-installed",
        detail: bin ?? undefined,
      });
      continue;
    }

    console.log(`  Invoking ${tool} for skill extraction...`);
    console.log(`  Command: ${cmd.bin} ${cmd.args.map((a) => (a.includes(" ") ? `"${a}"` : a)).join(" ")}`);
    console.log("");

    try {
      const result = await spawnAsync(cmd.bin, cmd.args, {
        cwd,
        timeoutMs: DEFAULT_EXTRACTION_TIMEOUT_MS,
        signal: options?.signal,
        env: { FORCE_COLOR: "0" },
      });

      if (result.success) {
        return { tool, success: true, output: result.stdout, skipped };
      }

      const output = result.stderr || result.stdout || `Process exited with code ${result.exitCode ?? "unknown"}`;
      const prefix = result.failureReason === "timeout" ? "[TIMEOUT] " : "";
      return { tool, success: false, output: prefix + output, skipped };
    } catch (err) {
      const output = err instanceof Error ? err.message : "Unknown error";
      return { tool, success: false, output, skipped };
    }
  }

  return { tool: null, success: false, output: "No usable AI tool found for skill extraction", skipped };
}

function workspaceExtractionHint(cwd: string): string {
  const pkgs = getWorkspacePackageDirs(cwd);
  if (pkgs.length < 2) return "";
  const sample = pkgs.slice(0, 25).join(", ");
  const more = pkgs.length > 25 ? ` (+${pkgs.length - 25} more)` : "";
  return ` This monorepo lists workspace packages: ${sample}${more}. When patterns differ by package, prefer separate skills or clearly scoped sections per package.`;
}

/**
 * Build extraction command arguments as a structured object (bin + args array).
 *
 * D2 fix: instead of returning a shell string with user input interpolated,
 * we return a `{ bin, args }` tuple so that `spawn(bin, args)` avoids shell
 * interpretation entirely.
 */
function buildExtractionArgs(
  tool: ToolId,
  cwd: string,
): { bin: string; args: string[] } | null {
  const prompt = [
    "Read the file .harness/skills/PROJECT-ANALYSIS.md for the static analysis of this project.",
    "Then read .harness/skills/skill-creator/SKILL.md to understand how to create high-quality skills.",
    "Based on both, extract project-specific skills following the process in .harness/skills/project-skill-extractor/SKILL.md.",
    "Create each skill as a directory under .harness/skills/ with a SKILL.md file.",
    "After creating all skills, update .harness/skills/INDEX.md.",
    workspaceExtractionHint(cwd),
  ]
    .join(" ")
    .trim();

  switch (tool) {
    case "claude-code":
      return { bin: "claude", args: ["-p", prompt] };
    case "codex":
      return { bin: "codex", args: ["exec", prompt] };
    case "cursor":
    case "copilot":
    case "opencode":
      return null;
    default:
      return null;
  }
}

function getBinName(tool: ToolId): string | null {
  const map: Record<string, string> = {
    "claude-code": "claude",
    codex: "codex",
    cursor: "cursor",
    copilot: "gh",
    opencode: "opencode",
  };
  return map[tool] ?? null;
}
