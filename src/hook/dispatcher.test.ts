import { describe, it, expect } from "vitest";
import { HookDispatcher } from "./dispatcher.js";
import type { HookHandler } from "./types.js";

const handlers: HookHandler[] = [
  { event: "setup.post", command: "echo setup-done" },
  { event: "verify.pre", command: "echo verify-start" },
  { event: "doctor.pre", command: "echo doctor-start" },
];

describe("HookDispatcher", () => {
  it("dispatches matching event handlers", async () => {
    const dispatcher = new HookDispatcher(handlers);
    const results = await dispatcher.dispatch("setup.post", process.cwd());
    expect(results).toHaveLength(1);
    expect(results[0].exitCode).toBe(0);
    expect(results[0].stdout.trim()).toBe("setup-done");
  });

  it("returns empty for unmatched events", async () => {
    const dispatcher = new HookDispatcher(handlers);
    const results = await dispatcher.dispatch("scaffold.pre", process.cwd());
    expect(results).toHaveLength(0);
  });

  it("checks hasHandlers correctly", () => {
    const dispatcher = new HookDispatcher(handlers);
    expect(dispatcher.hasHandlers("setup.post")).toBe(true);
    expect(dispatcher.hasHandlers("scaffold.pre")).toBe(false);
  });

  it("handles failing commands", async () => {
    const dispatcher = new HookDispatcher([
      { event: "setup.pre", command: "exit 1" },
    ]);
    const results = await dispatcher.dispatch("setup.pre", process.cwd());
    expect(results).toHaveLength(1);
    expect(results[0].exitCode).not.toBe(0);
  });

  it("measures duration", async () => {
    const dispatcher = new HookDispatcher(handlers);
    const results = await dispatcher.dispatch("verify.pre", process.cwd());
    expect(results[0].durationMs).toBeGreaterThanOrEqual(0);
  });
});
