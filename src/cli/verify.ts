import { execSync } from "node:child_process";
import { loadConfig, configExists } from "../config/loader.js";
import { detectProjectType } from "../adapter/detector.js";

export interface VerifyOptions {
  failFast?: boolean;
}

interface StageResult {
  stage: string;
  command: string;
  status: "pass" | "fail" | "skip";
  durationMs: number;
  output?: string;
}

export async function runVerify(opts: VerifyOptions): Promise<void> {
  const cwd = process.cwd();

  console.log("Agent Harness Verification");
  console.log("==========================\n");

  if (!configExists(cwd)) {
    console.log("  No harness configuration found. Run `agent-harness setup` first.");
    return;
  }

  const config = await loadConfig({ cwd });
  const commandMap = await resolveCommands(cwd);
  const globalFailFast = opts.failFast ?? config.workflows.verification.fail_fast;

  const stages = buildPipeline(config, commandMap);

  if (stages.length === 0) {
    console.log("  No verification stages configured.");
    return;
  }

  const results: StageResult[] = [];
  let failed = false;

  for (const stage of stages) {
    if (!stage.command) {
      console.log(`  [SKIP] ${stage.name} — no command configured`);
      results.push({ stage: stage.name, command: "", status: "skip", durationMs: 0 });
      continue;
    }

    const start = Date.now();
    try {
      execSync(stage.command, { cwd, stdio: "pipe", timeout: 120_000 });
      const durationMs = Date.now() - start;
      console.log(`  [PASS] ${stage.name} — ${stage.command} (${durationMs}ms)`);
      results.push({ stage: stage.name, command: stage.command, status: "pass", durationMs });
    } catch (err) {
      const durationMs = Date.now() - start;
      const output = err instanceof Error ? (err as { stderr?: Buffer }).stderr?.toString() ?? err.message : String(err);
      console.log(`  [FAIL] ${stage.name} — ${stage.command} (${durationMs}ms)`);
      results.push({ stage: stage.name, command: stage.command, status: "fail", durationMs, output });
      failed = true;

      const shouldStop = globalFailFast || stage.failFast;
      if (shouldStop) {
        console.log(`\n  Stopping: fail_fast enabled for stage "${stage.name}".`);
        break;
      }
    }
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const failures = results.filter((r) => r.status === "fail").length;
  const skipped = results.filter((r) => r.status === "skip").length;
  const totalMs = results.reduce((sum, r) => sum + r.durationMs, 0);

  console.log(`\nVerification: ${passed} passed, ${failures} failed, ${skipped} skipped (${totalMs}ms total)`);

  if (failed) {
    process.exitCode = 1;
  }
}

interface PipelineStage {
  name: string;
  command: string | undefined;
  failFast: boolean;
}

function buildPipeline(
  config: Awaited<ReturnType<typeof loadConfig>>,
  commandMap: Map<string, string>,
): PipelineStage[] {
  const verification = config.workflows.verification;

  if (verification.pipeline && verification.pipeline.length > 0) {
    return verification.pipeline.map((s) => ({
      name: s.name,
      command: s.command ?? commandMap.get(s.name) ?? config.workflows.commands[s.name],
      failFast: s.fail_fast,
    }));
  }

  return verification.checks.map((check) => ({
    name: check,
    command: commandMap.get(check) ?? config.workflows.commands[check],
    failFast: verification.fail_fast,
  }));
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
