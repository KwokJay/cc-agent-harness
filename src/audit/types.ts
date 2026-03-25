export type AuditEventKind =
  | "setup"
  | "update"
  | "doctor"
  | "verify"
  | "scaffold"
  | "config.loaded"
  | "config.changed"
  | "skill.discovered"
  | "hook.executed"
  | "custom";

export interface AuditEntry {
  timestamp: string;
  kind: AuditEventKind;
  message: string;
  data?: Record<string, unknown>;
}
