import { execSync } from "node:child_process";
import { HarnessRuntime, type RuntimeTask } from "../runtime/harness.js";

export interface VerifyOptions {
  failFast?: boolean;
  json?: boolean;
}

export interface StageResult {
  stage: string;
  command: string;
  source?: RuntimeTask["source"] | "pipeline";
  status: "pass" | "fail" | "skip";
  durationMs: number;
  output?: string;
}

export async function runVerify(opts: VerifyOptions): Promise<void> {
  const runtime = await HarnessRuntime.create({ requireProjectConfig: true });
  const config = runtime.config;

  if (!config) {
    throw new Error("Runtime expected configuration but none was loaded.");
  }

  const globalFailFast = opts.failFast ?? config.workflows.verification.fail_fast;
  const stages = buildPipeline(config, runtime.listTasks());

  if (stages.length === 0) {
    if (opts.json) {
      console.log(JSON.stringify({ results: [], summary: { pass: 0, fail: 0, skip: 0, totalMs: 0 } }, null, 2));
    } else {
      console.log("Agent Harness Verification");
      console.log("==========================\n");
      console.log("  No verification stages configured.");
    }
    return;
  }

  if (!opts.json) {
    console.log("Agent Harness Verification");
    console.log("==========================\n");
  }

  await runtime.dispatchHooks("verify.pre", {
    command: "verify",
    stages: stages.map((stage) => stage.name),
  });

  const results: StageResult[] = [];
  let failed = false;

  for (const stage of stages) {
    if (!stage.command) {
      if (!opts.json) {
        console.log(`  [SKIP] ${stage.name} — no command configured`);
      }
      results.push({
        stage: stage.name,
        command: "",
        source: stage.source,
        status: "skip",
        durationMs: 0,
      });
      continue;
    }

    const start = Date.now();
    try {
      execSync(stage.command, { cwd: runtime.cwd, stdio: "pipe", timeout: 120_000 });
      const durationMs = Date.now() - start;
      if (!opts.json) {
        console.log(`  [PASS] ${stage.name} — ${stage.command} (${durationMs}ms)`);
      }
      results.push({
        stage: stage.name,
        command: stage.command,
        source: stage.source,
        status: "pass",
        durationMs,
      });
    } catch (err) {
      const durationMs = Date.now() - start;
      const output = err instanceof Error ? (err as { stderr?: Buffer }).stderr?.toString() ?? err.message : String(err);
      if (!opts.json) {
        console.log(`  [FAIL] ${stage.name} — ${stage.command} (${durationMs}ms)`);
      }
      results.push({
        stage: stage.name,
        command: stage.command,
        source: stage.source,
        status: "fail",
        durationMs,
        output,
      });
      failed = true;

      const shouldStop = globalFailFast || stage.failFast;
      if (shouldStop) {
        if (!opts.json) {
          console.log(`\n  Stopping: fail_fast enabled for stage "${stage.name}".`);
        }
        break;
      }
    }
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const failures = results.filter((r) => r.status === "fail").length;
  const skipped = results.filter((r) => r.status === "skip").length;
  const totalMs = results.reduce((sum, r) => sum + r.durationMs, 0);

  const summary = { pass: passed, fail: failures, skip: skipped, totalMs };
  await runtime.dispatchHooks("verify.post", {
    command: "verify",
    summary,
    status: failed ? "fail" : "pass",
  });
  await runtime.log("verify", "Verification run completed", {
    summary,
    failed,
  });

  if (opts.json) {
    console.log(JSON.stringify({ results, summary }, null, 2));
  } else {
    console.log(`\nVerification: ${passed} passed, ${failures} failed, ${skipped} skipped (${totalMs}ms total)`);
  }

  if (failed) {
    process.exitCode = 1;
  }
}

interface PipelineStage {
  name: string;
  command: string | undefined;
  source?: RuntimeTask["source"] | "pipeline";
  failFast: boolean;
}

function buildPipeline(
  config: NonNullable<HarnessRuntime["config"]>,
  tasks: RuntimeTask[],
): PipelineStage[] {
  const verification = config.workflows.verification;
  const commandMap = new Map(tasks.map((task) => [task.name, task] as const));

  if (verification.pipeline && verification.pipeline.length > 0) {
    return verification.pipeline.map((s) => ({
      name: s.name,
      command: s.command ?? commandMap.get(s.name)?.command ?? config.workflows.commands[s.name],
      source: s.command ? "pipeline" : commandMap.get(s.name)?.source ?? "workflow",
      failFast: s.fail_fast,
    }));
  }

  return verification.checks.map((check) => ({
    name: check,
    command: commandMap.get(check)?.command ?? config.workflows.commands[check],
    source: commandMap.get(check)?.source ?? "workflow",
    failFast: verification.fail_fast,
  }));
}
