import { loadHarnessConfig } from "../../config/load-harness-config.js";
import { detectDrift } from "../../scaffold/differ.js";
import type { DiagnoseCheck, DiagnoseIssue } from "../types.js";

export const driftCheck: DiagnoseCheck = {
  id: "drift",
  description: "Compare canonical scaffold output to files on disk",
  async run(ctx): Promise<DiagnoseIssue[]> {
    const loaded = loadHarnessConfig(ctx.cwd);
    if (!loaded.valid || !loaded.config) {
      return [];
    }
    const report = detectDrift(ctx.cwd);
    if (report.clean) {
      return [{ id: "drift.ok", severity: "info", message: "No scaffold drift detected" }];
    }
    const issues: DiagnoseIssue[] = [];
    for (const e of report.drifted) {
      const severity = e.status === "missing" ? "error" : "warn";
      issues.push({
        id: `drift.${e.path}`,
        severity,
        message: `Scaffold drift: ${e.status} — ${e.path}`,
        details: e.hint,
      });
    }
    return issues;
  },
};
