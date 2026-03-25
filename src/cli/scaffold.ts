import { resolve } from "node:path";
import { loadConfig, configExists } from "../config/loader.js";
import { scaffoldSkill } from "../skill/scaffold.js";

export interface ScaffoldSkillOptions {
  description?: string;
}

export async function runScaffoldSkill(
  name: string,
  opts: ScaffoldSkillOptions,
): Promise<void> {
  const cwd = process.cwd();

  let targetDir = resolve(cwd, ".harness/skills");
  if (configExists(cwd)) {
    const config = await loadConfig({ cwd });
    const dirs = config.skills.directories;
    if (dirs.length > 0) {
      targetDir = resolve(cwd, dirs[0]);
    }
  }

  const displayName = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const description = opts.description ?? `${displayName} skill`;

  const skillDir = await scaffoldSkill(targetDir, {
    name,
    description,
    displayName,
  });

  console.log(`Skill scaffolded at ${skillDir}`);
  console.log("\nFiles created:");
  console.log("  SKILL.md         — Skill definition with frontmatter");
  console.log("  metadata.yaml    — Skill metadata for discovery");
}
