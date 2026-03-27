import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

/** Skills that are harness-internal / governance; excluded from cross-tool distribution checks. */
export const META_SKILL_IDS = new Set([
  "skill-creator",
  "project-skill-extractor",
  "changelog-governance",
  "docs-governance",
]);

/**
 * Skill directory names under `.harness/skills/` that contain `SKILL.md`.
 */
export function discoverHarnessSkillIds(cwd: string): string[] {
  const skillsDir = resolve(cwd, ".harness/skills");
  if (!existsSync(skillsDir)) return [];
  try {
    return readdirSync(skillsDir).filter((entry) => existsSync(resolve(skillsDir, entry, "SKILL.md")));
  } catch {
    return [];
  }
}

/**
 * Relative path where a skill is materialized for a given AI tool (empty if tool unknown).
 */
export function getDistributedSkillPath(tool: string, skillName: string): string {
  const pathMap: Record<string, (name: string) => string> = {
    cursor: (n) => `.cursor/rules/skill-${n}.mdc`,
    "claude-code": (n) => `.claude/skills/${n}/SKILL.md`,
    copilot: (n) => `.github/instructions/${n}.instructions.md`,
    codex: (n) => `.agents/skills/${n}/SKILL.md`,
    opencode: (n) => `.opencode/skills/${n}/SKILL.md`,
    windsurf: (n) => `.windsurf/rules/skill-${n}.md`,
    trae: (n) => `.trae/rules/skill-${n}.md`,
    augment: (n) => `.augment/skills/${n}/SKILL.md`,
  };
  return pathMap[tool]?.(skillName) ?? "";
}

export function isMetaSkill(skillId: string): boolean {
  return META_SKILL_IDS.has(skillId);
}
