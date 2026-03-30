export type DiagnoseSeverity = "error" | "warn" | "info";

export interface DiagnoseIssue {
  /** Check id + optional suffix, e.g. `skill-dist-cursor`. */
  id: string;
  severity: DiagnoseSeverity;
  message: string;
  details?: string;
}

import type { ToolId } from "../tool-adapters/types.js";

export interface DiagnoseContext {
  cwd: string;
  /** When set (from `.harness/config.yaml`), tool-scoped checks run only for configured tools. */
  tools?: ToolId[];
}

export interface DiagnoseCheck {
  id: string;
  description: string;
  run(ctx: DiagnoseContext): Promise<DiagnoseIssue[]>;
}

export interface DiagnoseReport {
  issues: DiagnoseIssue[];
  summary: { error: number; warn: number; info: number };
}
