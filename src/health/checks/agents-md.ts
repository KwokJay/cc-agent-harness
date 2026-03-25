import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { HealthCheck } from "../../adapter/interface.js";

export function agentsMdHealthCheck(cwd: string): HealthCheck {
  return {
    name: "agents-md",
    check: async () => {
      const agentsMd = resolve(cwd, "AGENTS.md");
      if (existsSync(agentsMd)) {
        return { status: "pass", message: "AGENTS.md exists" };
      }
      return { status: "warn", message: "AGENTS.md not found — consider running `agent-harness setup`" };
    },
  };
}
