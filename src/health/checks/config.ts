import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { HealthCheck } from "../../adapter/interface.js";

export function configHealthCheck(cwd: string): HealthCheck {
  return {
    name: "harness-config",
    check: async () => {
      const configPath = resolve(cwd, ".harness/harness.config.yaml");
      if (existsSync(configPath)) {
        return { status: "pass", message: "harness.config.yaml exists and valid" };
      }
      return { status: "fail", message: "harness.config.yaml not found — run `agent-harness setup`" };
    },
  };
}
