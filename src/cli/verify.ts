import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { loadHarnessConfig } from "../config/load-harness-config.js";
import { getHarnessVersion } from "./harness-version.js";

export interface VerifyOptions {
  cwd?: string;
  /** When true, only print failures (used from doctor). */
  quiet?: boolean;
  /** When false, skip writing `.harness/state/last-verify.json`. */
  writeState?: boolean;
}

export interface LastVerifyState {
  timestamp: string;
  ok: boolean;
  failedChecks: string[];
  harnessVersion: string;
  /** Same order as config checks; true = exit 0 */
  results: { check: string; ok: boolean }[];
}

/**
 * Runs `workflows.verification.checks` in order, resolving each check name to
 * `workflows.commands[check]`. Exits with failure if any command is missing or returns non-zero.
 * @returns true if all checks passed or no checks configured; false otherwise.
 */
export function runVerify(opts: VerifyOptions = {}): boolean {
  const cwd = opts.cwd ?? process.cwd();
  const writeState = opts.writeState !== false;

  const loaded = loadHarnessConfig(cwd);
  if (!loaded.valid || !loaded.config) {
    const msg = loaded.errors.join("; ");
    console.error(`verify: ${msg}`);
    return false;
  }

  const validation = { valid: true as const, config: loaded.config };
  const { checks } = validation.config.workflows.verification;
  const { commands } = validation.config.workflows;

  if (checks.length === 0) {
    if (!opts.quiet) {
      console.log("verify: no workflows.verification.checks configured; nothing to run.");
    }
    if (writeState) {
      writeLastVerifyState(cwd, {
        timestamp: new Date().toISOString(),
        ok: true,
        failedChecks: [],
        harnessVersion: getHarnessVersion(),
        results: [],
      });
    }
    return true;
  }

  if (!opts.quiet) {
    console.log("Agent Harness Verify");
    console.log("===================\n");
  }

  const failures: string[] = [];
  const results: { check: string; ok: boolean }[] = [];

  for (const check of checks) {
    const cmd = commands[check];
    if (typeof cmd !== "string" || !cmd.trim()) {
      const msg = `check "${check}": no command in workflows.commands`;
      failures.push(check);
      results.push({ check, ok: false });
      console.error(`  [FAIL] ${msg}`);
      continue;
    }

    if (!opts.quiet) {
      console.log(`  Running [${check}]: ${cmd}`);
    }

    const result = spawnSync(cmd, { cwd, shell: true, stdio: "inherit" });
    const code = result.status ?? 1;
    if (code !== 0) {
      const msg = `check "${check}" exited with code ${code}`;
      failures.push(check);
      results.push({ check, ok: false });
      console.error(`  [FAIL] ${msg}`);
    } else {
      results.push({ check, ok: true });
      if (!opts.quiet) {
        console.log(`  [OK]   [${check}]`);
      }
    }
  }

  const ok = failures.length === 0;
  if (writeState) {
    writeLastVerifyState(cwd, {
      timestamp: new Date().toISOString(),
      ok,
      failedChecks: failures,
      harnessVersion: getHarnessVersion(),
      results,
    });
  }

  if (!ok) {
    console.error(`\nverify: ${failures.length} check(s) failed.`);
    console.error(`  Next: fix failing checks above, then re-run 'harn verify'.`);
    return false;
  }

  if (!opts.quiet) {
    console.log(`\nverify: all ${checks.length} check(s) passed.`);
    console.log(`  Tip: use 'harn diagnose --json | jq .summary' in CI to gate on harness health.`);
  }
  return true;
}

const STALE_VERIFY_DAYS = 7;

export function getStaleVerifyDays(): number {
  return STALE_VERIFY_DAYS;
}

function stateDir(cwd: string): string {
  return resolve(cwd, ".harness/state");
}

export function lastVerifyStatePath(cwd: string): string {
  return resolve(stateDir(cwd), "last-verify.json");
}

function writeLastVerifyState(cwd: string, state: LastVerifyState): void {
  try {
    const dir = stateDir(cwd);
    mkdirSync(dir, { recursive: true });
    writeFileSync(lastVerifyStatePath(cwd), JSON.stringify(state, null, 2) + "\n", "utf-8");
  } catch {
    /* optional local state */
  }
}

export function readLastVerifyState(cwd: string): LastVerifyState | null {
  const p = lastVerifyStatePath(cwd);
  if (!existsSync(p)) return null;
  try {
    const raw = JSON.parse(readFileSync(p, "utf-8")) as LastVerifyState;
    if (typeof raw.timestamp !== "string" || typeof raw.ok !== "boolean") return null;
    return raw;
  } catch {
    return null;
  }
}

/** Days since last-verify.json timestamp, or null if missing/unparseable. */
export function daysSinceLastVerify(cwd: string): number | null {
  const state = readLastVerifyState(cwd);
  if (!state) return null;
  const t = Date.parse(state.timestamp);
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (86_400_000);
}

export async function runVerifyCli(): Promise<void> {
  const ok = runVerify({ cwd: process.cwd() });
  if (!ok) process.exitCode = 1;
}
