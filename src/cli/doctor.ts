import { runHealthChecks, formatReport } from "../health/checker.js";
import { configHealthCheck } from "../health/checks/config.js";
import { skillsHealthCheck } from "../health/checks/skills.js";
import { agentsMdHealthCheck } from "../health/checks/agents-md.js";
import { toolHealthChecks } from "../health/checks/tools.js";
import { detectProjectType } from "../adapter/detector.js";
import { AgentRegistry } from "../agent/registry.js";
import { loadConfig, configExists } from "../config/loader.js";
import type { HealthCheck } from "../adapter/interface.js";

export async function runDoctor(): Promise<void> {
  const cwd = process.cwd();
  const checks: HealthCheck[] = [];

  checks.push(configHealthCheck(cwd));
  checks.push(agentsMdHealthCheck(cwd));
  checks.push(...toolHealthChecks());

  const adapter = await detectProjectType(cwd);
  if (adapter) {
    checks.push(...adapter.getHealthChecks());
  }

  if (configExists(cwd)) {
    const config = await loadConfig({ cwd });
    checks.push(skillsHealthCheck(cwd, config.skills.directories));

    const registry = new AgentRegistry(config.agents.definitions);
    const counts = registry.count();
    checks.push({
      name: "agent-definitions",
      check: async () => ({
        status: "pass",
        message: `Agent definitions: ${counts.custom} custom + ${counts.builtin} built-in`,
      }),
    });
  } else {
    checks.push(skillsHealthCheck(cwd));
  }

  const report = await runHealthChecks(checks);
  console.log(formatReport(report));

  if (report.summary.fail > 0) {
    process.exitCode = 1;
  }
}
