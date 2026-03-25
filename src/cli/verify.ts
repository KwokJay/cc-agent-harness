import { execSync } from "node:child_process";
import { loadConfig, configExists } from "../config/loader.js";
import { detectProjectType } from "../adapter/detector.js";
import type { CommandDefinition } from "../adapter/interface.js";

export interface VerifyOptions {
  failFast?: boolean;
}

interface VerifyResult {
  check: string;
  command: string;
  status: "pass" | "fail";
  output?: string;
}

export async function runVerify(opts: VerifyOptions): Promise<void> {
  const cwd = process.cwd();
  const failFast = opts.failFast ?? false;

  console.log("Agent Harness Verification");
  console.log("==========================\n");

  const commandMap = await resolveCommands(cwd);

  if (!configExists(cwd)) {
    console.log("  No harness configuration found. Run `agent-harness setup` first.");
    return;
  }

  const config = await loadConfig({ cwd });
  const checks = config.workflows.verification.checks;

  if (checks.length === 0) {
    console.log("  No verification checks configured.");
    return;
  }

  const results: VerifyResult[] = [];
  let failed = false;

  for (const check of checks) {
    const command = commandMap.get(check) ?? config.workflows.commands[check];
    if (!command) {
      console.log(`  [SKIP] ${check} — no command configured`);
      results.push({ check, command: "", status: "fail", output: "no command configured" });
      continue;
    }

    try {
      execSync(command, { cwd, stdio: "pipe", timeout: 120_000 });
      console.log(`  [PASS] ${check} — ${command}`);
      results.push({ check, command, status: "pass" });
    } catch (err) {
      const output = err instanceof Error ? (err as { stderr?: Buffer }).stderr?.toString() ?? err.message : String(err);
      console.log(`  [FAIL] ${check} — ${command}`);
      results.push({ check, command, status: "fail", output });
      failed = true;
      if (failFast) {
        console.log("\n  --fail-fast: stopping after first failure.");
        break;
      }
    }
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const failures = results.filter((r) => r.status === "fail").length;
  console.log(`\nVerification: ${passed} passed, ${failures} failed out of ${results.length} checks.`);

  if (failed) {
    process.exitCode = 1;
  }
}

async function resolveCommands(cwd: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const adapter = await detectProjectType(cwd);
  if (adapter) {
    for (const cmd of adapter.getCommands()) {
      map.set(cmd.name, cmd.command);
    }
  }
  return map;
}
