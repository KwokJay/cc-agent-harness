export type DiagnoseSeverity = "error" | "warn" | "info";

export interface DiagnoseIssue {
  /** Check id + optional suffix, e.g. `skill-dist-cursor`. */
  id: string;
  severity: DiagnoseSeverity;
  message: string;
  details?: string;
}

export interface DiagnoseContext {
  cwd: string;
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
