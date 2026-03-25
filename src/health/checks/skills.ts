import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { discoverSkills } from "../../skill/manager.js";
import type { HealthCheck } from "../../adapter/interface.js";

export function skillsHealthCheck(cwd: string): HealthCheck {
  return {
    name: "skills-directory",
    check: async () => {
      const dirs = [".codex/skills", ".harness/skills"];
      const existing = dirs.filter((d) => existsSync(resolve(cwd, d)));
      if (existing.length === 0) {
        return { status: "warn", message: "No skills directories found" };
      }

      const skills = await discoverSkills(dirs, cwd);
      const valid = skills.filter((s) => s.valid).length;
      const invalid = skills.length - valid;

      if (invalid > 0) {
        return {
          status: "warn",
          message: `${skills.length} skills found, ${invalid} with validation issues`,
        };
      }
      return { status: "pass", message: `${skills.length} skills found, all valid` };
    },
  };
}
