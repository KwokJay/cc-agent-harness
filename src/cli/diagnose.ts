import { runDiagnoseChecks, summarizeDiagnoseIssues } from "../diagnose/registry.js";
import { runVerify } from "./verify.js";

export interface DiagnoseCliOptions {
  json?: boolean;
  runVerify?: boolean;
  cwd?: string;
}

export async function runDiagnose(opts: DiagnoseCliOptions = {}): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const report = await runDiagnoseChecks({ cwd });

  if (opts.runVerify) {
    const loaded = await import("../config/load-harness-config.js").then((m) => m.loadHarnessConfig(cwd));
    if (loaded.valid && loaded.config) {
      if (!opts.json) {
        console.log("\n--- Verification (diagnose --run-verify) ---\n");
      }
      const ok = runVerify({ cwd, quiet: opts.json ?? false });
      if (!ok) {
        report.issues.push({
          id: "verify.failed",
          severity: "error",
          message: "One or more verification checks failed (see output above)",
        });
      } else {
        report.issues.push({
          id: "verify.ok",
          severity: "info",
          message: "Verification checks passed",
        });
      }
      report.summary = summarizeDiagnoseIssues(report.issues);
    }
  }

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("Agent Harness Diagnose");
    console.log("======================\n");
    const icon = { error: "[ERROR]", warn: "[WARN]", info: "[INFO]" };
    for (const i of report.issues) {
      console.log(`  ${icon[i.severity]} ${i.message}`);
      if (i.details) {
        for (const line of i.details.split("\n")) {
          console.log(`         ${line}`);
        }
      }
    }
    console.log(
      `\nSummary: ${report.summary.error} error(s), ${report.summary.warn} warning(s), ${report.summary.info} info`,
    );
  }

  if (report.summary.error > 0) process.exitCode = 1;
}
