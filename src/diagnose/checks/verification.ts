import { loadHarnessConfig } from "../../config/load-harness-config.js";
import type { DiagnoseCheck, DiagnoseIssue } from "../types.js";

export const verificationWiringCheck: DiagnoseCheck = {
  id: "verification",
  description: "Each workflows.verification.checks entry maps to a non-empty workflows.commands value",
  async run(ctx): Promise<DiagnoseIssue[]> {
    const loaded = loadHarnessConfig(ctx.cwd);
    if (!loaded.valid || !loaded.config) return [];

    const issues: DiagnoseIssue[] = [];
    const { checks } = loaded.config.workflows.verification;
    const { commands } = loaded.config.workflows;

    for (const name of checks) {
      const cmd = commands[name];
      if (typeof cmd !== "string" || !cmd.trim()) {
        issues.push({
          id: `verification.missing-command.${name}`,
          severity: "error",
          message: `Verification check "${name}" has no command in workflows.commands`,
        });
      }
    }

    if (issues.length === 0 && checks.length > 0) {
      issues.push({
        id: "verification.ok",
        severity: "info",
        message: `All ${checks.length} verification check(s) resolve to commands`,
      });
    } else if (checks.length === 0) {
      issues.push({
        id: "verification.empty",
        severity: "info",
        message: "No verification checks configured",
      });
    }

    return issues;
  },
};
