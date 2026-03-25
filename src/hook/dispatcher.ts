import { execSync } from "node:child_process";
import type { HookEventName, HookHandler, HookPayload, HookResult } from "./types.js";

export class HookDispatcher {
  private handlers: HookHandler[];

  constructor(handlers: HookHandler[]) {
    this.handlers = handlers;
  }

  async dispatch(
    event: HookEventName,
    cwd: string,
    data?: Record<string, unknown>,
  ): Promise<HookResult[]> {
    const matching = this.handlers.filter((h) => h.event === event);
    if (matching.length === 0) return [];

    const payload: HookPayload = {
      event,
      timestamp: new Date().toISOString(),
      cwd,
      data,
    };

    const payloadJson = JSON.stringify(payload);
    const results: HookResult[] = [];

    for (const handler of matching) {
      if (handler.matcher && data) {
        const matchValue = String(data.match ?? "");
        if (matchValue && !matchValue.includes(handler.matcher)) continue;
      }

      const start = Date.now();
      try {
        const stdout = execSync(handler.command, {
          cwd,
          input: payloadJson,
          stdio: ["pipe", "pipe", "pipe"],
          timeout: 30_000,
        }).toString();

        results.push({
          handler,
          exitCode: 0,
          stdout,
          stderr: "",
          durationMs: Date.now() - start,
        });
      } catch (err) {
        const execErr = err as { status?: number; stdout?: Buffer; stderr?: Buffer };
        results.push({
          handler,
          exitCode: execErr.status ?? 1,
          stdout: execErr.stdout?.toString() ?? "",
          stderr: execErr.stderr?.toString() ?? "",
          durationMs: Date.now() - start,
        });
      }
    }

    return results;
  }

  hasHandlers(event: HookEventName): boolean {
    return this.handlers.some((h) => h.event === event);
  }
}
