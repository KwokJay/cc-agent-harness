import { execSync } from "node:child_process";
import type { HealthCheck } from "../../adapter/interface.js";

function toolCheck(name: string, command: string): HealthCheck {
  return {
    name: `tool-${name}`,
    check: async () => {
      try {
        execSync(command, { stdio: "pipe" });
        return { status: "pass", message: `${name} is available` };
      } catch {
        return { status: "warn", message: `${name} not found (recommended)` };
      }
    },
  };
}

export function toolHealthChecks(): HealthCheck[] {
  return [
    toolCheck("git", "git --version"),
    toolCheck("node", "node --version"),
  ];
}
