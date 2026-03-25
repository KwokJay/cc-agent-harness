import { appendFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import type { AuditEntry, AuditEventKind } from "./types.js";

const DEFAULT_LOG_DIR = ".harness/logs";
const LOG_FILE = "audit.jsonl";

export class AuditLogger {
  private logPath: string;

  constructor(cwd: string, logDir?: string) {
    this.logPath = resolve(cwd, logDir ?? DEFAULT_LOG_DIR, LOG_FILE);
  }

  async log(kind: AuditEventKind, message: string, data?: Record<string, unknown>): Promise<void> {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      kind,
      message,
      data,
    };

    await mkdir(dirname(this.logPath), { recursive: true });
    await appendFile(this.logPath, JSON.stringify(entry) + "\n", "utf-8");
  }

  getLogPath(): string {
    return this.logPath;
  }
}
