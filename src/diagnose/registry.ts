import type { DiagnoseCheck, DiagnoseContext, DiagnoseIssue, DiagnoseReport } from "./types.js";
import { configYamlCheck } from "./checks/config.js";
import { verificationWiringCheck } from "./checks/verification.js";
import { cursorMcpJsonCheck } from "./checks/mcp-json.js";
import { harnessWritableCheck } from "./checks/writable.js";
import { skillDistributionCheck } from "./checks/skills.js";
import { driftCheck } from "./checks/drift.js";

/** Built-in checks; future community packs can append. */
export const defaultDiagnoseChecks: DiagnoseCheck[] = [
  configYamlCheck,
  verificationWiringCheck,
  skillDistributionCheck,
  cursorMcpJsonCheck,
  harnessWritableCheck,
  driftCheck,
];

export function summarizeDiagnoseIssues(issues: DiagnoseIssue[]): DiagnoseReport["summary"] {
  return {
    error: issues.filter((i) => i.severity === "error").length,
    warn: issues.filter((i) => i.severity === "warn").length,
    info: issues.filter((i) => i.severity === "info").length,
  };
}

export async function runDiagnoseChecks(
  ctx: DiagnoseContext,
  checks: DiagnoseCheck[] = defaultDiagnoseChecks,
): Promise<DiagnoseReport> {
  const issues: DiagnoseIssue[] = [];
  for (const check of checks) {
    const out = await check.run(ctx);
    issues.push(...out);
  }
  return { issues, summary: summarizeDiagnoseIssues(issues) };
}
