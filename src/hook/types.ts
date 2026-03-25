export type HookEventName =
  | "setup.pre"
  | "setup.post"
  | "update.pre"
  | "update.post"
  | "doctor.pre"
  | "doctor.post"
  | "verify.pre"
  | "verify.post"
  | "scaffold.pre"
  | "scaffold.post"
  | "skill.discovered"
  | "config.loaded";

export interface HookPayload {
  event: HookEventName;
  timestamp: string;
  cwd: string;
  data?: Record<string, unknown>;
}

export interface HookHandler {
  event: HookEventName;
  command: string;
  matcher?: string;
}

export interface HookResult {
  handler: HookHandler;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface HooksConfig {
  hooks?: HookHandler[];
}
