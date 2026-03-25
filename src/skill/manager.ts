import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";
import { validateSkill, type SkillValidationResult } from "./validator.js";

export interface SkillInfo {
  name: string;
  description: string;
  path: string;
  valid: boolean;
}

export async function discoverSkills(
  directories: string[],
  cwd?: string,
): Promise<SkillInfo[]> {
  const base = cwd ?? process.cwd();
  const skills: SkillInfo[] = [];

  for (const dir of directories) {
    const absDir = resolve(base, dir);
    if (!existsSync(absDir)) continue;

    const entries = await readdir(absDir);
    for (const entry of entries) {
      const skillDir = join(absDir, entry);
      const info = await stat(skillDir);
      if (!info.isDirectory()) continue;

      const skillMd = join(skillDir, "SKILL.md");
      if (!existsSync(skillMd)) continue;

      const validation = await validateSkill(skillDir);
      skills.push({
        name: validation.name ?? entry,
        description: validation.description ?? "",
        path: skillDir,
        valid: validation.valid,
      });
    }
  }

  return skills;
}

export async function listSkillDirectories(cwd?: string): Promise<string[]> {
  const base = cwd ?? process.cwd();
  const candidates = [".codex/skills", ".harness/skills"];
  return candidates
    .map((d) => resolve(base, d))
    .filter((d) => existsSync(d));
}
