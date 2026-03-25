import type { HealthCheck, HealthCheckResult } from "../adapter/interface.js";

export interface HealthReport {
  results: HealthReportEntry[];
  summary: { pass: number; warn: number; fail: number };
}

export interface HealthReportEntry {
  name: string;
  result: HealthCheckResult;
}

export async function runHealthChecks(
  checks: HealthCheck[],
): Promise<HealthReport> {
  const results: HealthReportEntry[] = [];

  for (const check of checks) {
    try {
      const result = await check.check();
      results.push({ name: check.name, result });
    } catch (err) {
      results.push({
        name: check.name,
        result: {
          status: "fail",
          message: `Check threw: ${err instanceof Error ? err.message : String(err)}`,
        },
      });
    }
  }

  const summary = { pass: 0, warn: 0, fail: 0 };
  for (const r of results) {
    summary[r.result.status]++;
  }

  return { results, summary };
}

export function formatReport(report: HealthReport): string {
  const lines = ["Agent Harness Health Check", "=========================="];

  const statusIcon = { pass: "[PASS]", warn: "[WARN]", fail: "[FAIL]" } as const;

  for (const entry of report.results) {
    lines.push(`${statusIcon[entry.result.status]} ${entry.result.message}`);
  }

  lines.push("");
  lines.push(
    `Summary: ${report.summary.pass} passed, ${report.summary.warn} warning(s), ${report.summary.fail} failure(s)`,
  );

  return lines.join("\n");
}
