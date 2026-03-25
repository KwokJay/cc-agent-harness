import { runHealthChecks, formatReport } from "../health/checker.js";
import { configHealthCheck } from "../health/checks/config.js";
import { skillsHealthCheck } from "../health/checks/skills.js";
import { agentsMdHealthCheck } from "../health/checks/agents-md.js";
import { toolHealthChecks } from "../health/checks/tools.js";
import type { HealthCheck } from "../adapter/interface.js";
import { HarnessRuntime } from "../runtime/harness.js";

export interface DoctorOptions {
  json?: boolean;
}

export async function runDoctor(opts: DoctorOptions = {}): Promise<void> {
  const runtime = await HarnessRuntime.create();
  const checks: HealthCheck[] = [];

  checks.push(configHealthCheck(runtime.cwd));
  checks.push(agentsMdHealthCheck(runtime.cwd));
  checks.push(...toolHealthChecks());

  if (runtime.adapter) {
    checks.push(...runtime.adapter.getHealthChecks());
  }

  if (runtime.config) {
    checks.push(skillsHealthCheck(runtime.cwd, runtime.config.skills.directories));

    const counts = runtime.agentRegistry.count();
    checks.push({
      name: "agent-definitions",
      check: async () => ({
        status: "pass",
        message: `Agent definitions: ${counts.custom} custom + ${counts.builtin} built-in`,
      }),
    });

    const features = runtime.listFeatureStates();
    checks.push({
      name: "feature-flags",
      check: async () => ({
        status: "pass",
        message: `Feature flags: ${features.filter((feature) => feature.enabled).length} enabled of ${features.length}`,
      }),
    });
  } else {
    checks.push(skillsHealthCheck(runtime.cwd));
  }

  await runtime.dispatchHooks("doctor.pre", { command: "doctor" });
  const report = await runHealthChecks(checks);
  await runtime.dispatchHooks("doctor.post", {
    command: "doctor",
    summary: report.summary,
    status: report.summary.fail > 0 ? "fail" : "pass",
  });
  await runtime.log("doctor", "Doctor run completed", {
    summary: report.summary,
    adapter: runtime.adapter?.name ?? null,
  });

  if (opts.json) {
    console.log(JSON.stringify({
      adapter: runtime.adapter?.name ?? null,
      results: report.results,
      summary: report.summary,
      features: runtime.listFeatureStates().map((feature) => ({
        key: feature.spec.key,
        stage: feature.spec.stage,
        enabled: feature.enabled,
        configured: feature.configured,
        configuredValue: feature.configuredValue,
      })),
    }, null, 2));
  } else {
    console.log(formatReport(report));
  }

  if (report.summary.fail > 0) {
    process.exitCode = 1;
  }
}
