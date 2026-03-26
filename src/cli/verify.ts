import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { parse as parseYaml } from "yaml";
import { validateConfig } from "../config/schema.js";

export interface VerifyOptions {
  cwd?: string;
  /** When true, only print failures (used from doctor). */
  quiet?: boolean;
}

/**
 * Runs `workflows.verification.checks` in order, resolving each check name to
 * `workflows.commands[check]`. Exits with failure if any command is missing or returns non-zero.
 * @returns true if all checks passed or no checks configured; false otherwise.
 */
export function runVerify(opts: VerifyOptions = {}): boolean {
  const cwd = opts.cwd ?? process.cwd();
  const configPath = resolve(cwd, ".harness/config.yaml");

  if (!existsSync(configPath)) {
    console.error("verify: .harness/config.yaml not found");
    return false;
  }

  let raw: unknown;
  try {
    raw = parseYaml(readFileSync(configPath, "utf-8"));
  } catch {
    console.error("verify: failed to parse .harness/config.yaml");
    return false;
  }

  const validation = validateConfig(raw);
  if (!validation.valid || !validation.config) {
    console.error(`verify: invalid config: ${validation.errors.join("; ")}`);
    return false;
  }

  const { checks } = validation.config.workflows.verification;
  const { commands } = validation.config.workflows;

  if (checks.length === 0) {
    if (!opts.quiet) {
      console.log("verify: no workflows.verification.checks configured; nothing to run.");
    }
    return true;
  }

  if (!opts.quiet) {
    console.log("Agent Harness Verify");
    console.log("===================\n");
  }

  const failures: string[] = [];

  for (const check of checks) {
    const cmd = commands[check];
    if (typeof cmd !== "string" || !cmd.trim()) {
      const msg = `check "${check}": no command in workflows.commands`;
      failures.push(msg);
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
      failures.push(msg);
      console.error(`  [FAIL] ${msg}`);
    } else if (!opts.quiet) {
      console.log(`  [OK]   [${check}]`);
    }
  }

  if (failures.length > 0) {
    console.error(`\nverify: ${failures.length} check(s) failed.`);
    return false;
  }

  if (!opts.quiet) {
    console.log(`\nverify: all ${checks.length} check(s) passed.`);
  }
  return true;
}

export async function runVerifyCli(): Promise<void> {
  const ok = runVerify({ cwd: process.cwd() });
  if (!ok) process.exitCode = 1;
}
