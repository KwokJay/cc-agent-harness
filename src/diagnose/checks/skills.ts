import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadHarnessConfig } from "../../config/load-harness-config.js";
import {
  discoverHarnessSkillIds,
  getDistributedSkillPath,
  isMetaSkill,
} from "../../harness-inventory/index.js";
import { parseSkillFile } from "../../skill-extraction/parser.js";
import type { DiagnoseCheck, DiagnoseIssue } from "../types.js";

export const skillDistributionCheck: DiagnoseCheck = {
  id: "skills",
  description: "Skill distribution across configured tools (excludes meta skills)",
  async run(ctx): Promise<DiagnoseIssue[]> {
    const loaded = loadHarnessConfig(ctx.cwd);
    if (!loaded.valid || !loaded.config) return [];

    const tools = loaded.config.tools as string[];
    const skills = discoverHarnessSkillIds(ctx.cwd);
    const issues: DiagnoseIssue[] = [];

    const distributable = skills.filter((s) => !isMetaSkill(s));
    if (distributable.length === 0) {
      issues.push({
        id: "skills.none",
        severity: "info",
        message: "No distributable skills under .harness/skills/",
      });
      return issues;
    }

    for (const tool of tools) {
      const testPath = getDistributedSkillPath(tool, "test");
      if (!testPath) {
        issues.push({
          id: `skills.unknown-tool.${tool}`,
          severity: "warn",
          message: `Unknown tool "${tool}", skipping skill path checks`,
        });
        continue;
      }

      const missing = distributable.filter((s) => {
        const p = getDistributedSkillPath(tool, s);
        return !p || !existsSync(resolve(ctx.cwd, p));
      });

      if (missing.length === 0) {
        issues.push({
          id: `skills.dist.ok.${tool}`,
          severity: "info",
          message: `${tool}: all ${distributable.length} skill(s) distributed`,
        });
      } else {
        issues.push({
          id: `skills.dist.missing.${tool}`,
          severity: missing.length === distributable.length ? "error" : "warn",
          message: `${tool}: ${missing.length}/${distributable.length} skill(s) not distributed: ${missing.join(", ")}`,
        });
      }
    }

    const skillsDir = resolve(ctx.cwd, ".harness/skills");
    for (const skill of skills) {
      if (isMetaSkill(skill)) continue;
      const skillPath = resolve(skillsDir, skill, "SKILL.md");
      if (!existsSync(skillPath)) continue;
      let parsed;
      try {
        parsed = parseSkillFile(readFileSync(skillPath, "utf-8"));
      } catch {
        continue;
      }
      if (parsed.source !== "manual") continue;
      const missingTools: string[] = [];
      for (const tool of tools) {
        const p = getDistributedSkillPath(tool, skill);
        if (!p || !existsSync(resolve(ctx.cwd, p))) missingTools.push(tool);
      }
      if (missingTools.length > 0) {
        issues.push({
          id: `skills.manual.${skill}`,
          severity: "warn",
          message: `Manual skill "${skill}" missing in tool path(s): ${missingTools.join(", ")}`,
        });
      }
    }

    return issues;
  },
};
