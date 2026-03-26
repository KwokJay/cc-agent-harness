import { describe, expect, it, vi, beforeEach } from "vitest";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const { spawnSyncMock } = vi.hoisted(() => ({
  spawnSyncMock: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  spawnSync: (...args: unknown[]) => spawnSyncMock(...args),
}));

import { runVerify } from "../../../src/cli/verify.js";

describe("runVerify", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "harness-verify-"));
    mkdirSync(join(dir, ".harness"), { recursive: true });
    spawnSyncMock.mockReset();
    spawnSyncMock.mockReturnValue({ status: 0 });
  });

  it("returns false when config is missing", () => {
    expect(runVerify({ cwd: dir, writeState: false })).toBe(false);
  });

  it("runs checks in order and returns true when all pass", () => {
    writeFileSync(
      join(dir, ".harness/config.yaml"),
      `
project:
  name: t
  type: backend
  language: typescript
tools: [cursor]
workflows:
  commands:
    lint: echo lint
    test: echo test
  verification:
    checks: [lint, test]
`,
      "utf-8",
    );

    expect(runVerify({ cwd: dir, quiet: true, writeState: false })).toBe(true);
    expect(spawnSyncMock).toHaveBeenCalledTimes(2);
    expect(spawnSyncMock.mock.calls[0][0]).toBe("echo lint");
    expect(spawnSyncMock.mock.calls[1][0]).toBe("echo test");
  });

  it("returns false when a check command is missing", () => {
    writeFileSync(
      join(dir, ".harness/config.yaml"),
      `
project:
  name: t
  type: backend
  language: typescript
tools: [cursor]
workflows:
  commands:
    lint: echo ok
  verification:
    checks: [lint, test]
`,
      "utf-8",
    );

    expect(runVerify({ cwd: dir, quiet: true, writeState: false })).toBe(false);
  });

  it("returns true when no checks configured", () => {
    writeFileSync(
      join(dir, ".harness/config.yaml"),
      `
project:
  name: t
  type: backend
  language: typescript
tools: [cursor]
workflows:
  commands: {}
  verification:
    checks: []
`,
      "utf-8",
    );

    expect(runVerify({ cwd: dir, quiet: true, writeState: false })).toBe(true);
    expect(spawnSyncMock).not.toHaveBeenCalled();
  });

  it("returns false when spawnSync returns non-zero", () => {
    writeFileSync(
      join(dir, ".harness/config.yaml"),
      `
project:
  name: t
  type: backend
  language: typescript
tools: [cursor]
workflows:
  commands:
    lint: echo x
  verification:
    checks: [lint]
`,
      "utf-8",
    );

    spawnSyncMock.mockReturnValue({ status: 1 });
    expect(runVerify({ cwd: dir, quiet: true, writeState: false })).toBe(false);
  });

  it("writes .harness/state/last-verify.json on success", () => {
    writeFileSync(
      join(dir, ".harness/config.yaml"),
      `
project:
  name: t
  type: backend
  language: typescript
tools: [cursor]
workflows:
  commands:
    lint: echo ok
  verification:
    checks: [lint]
`,
      "utf-8",
    );

    expect(runVerify({ cwd: dir, quiet: true, writeState: true })).toBe(true);
    const statePath = join(dir, ".harness/state/last-verify.json");
    expect(existsSync(statePath)).toBe(true);
    const state = JSON.parse(readFileSync(statePath, "utf-8")) as { ok: boolean; results: unknown[] };
    expect(state.ok).toBe(true);
    expect(Array.isArray(state.results)).toBe(true);
  });
});
