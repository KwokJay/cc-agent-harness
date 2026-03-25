import { resolve } from "node:path";
import { loadConfig, projectConfigExists } from "../config/loader.js";
import { scaffoldSkill } from "../skill/scaffold.js";
import { HarnessRuntime } from "../runtime/harness.js";

export interface ScaffoldSkillOptions {
  description?: string;
}

export async function runScaffoldSkill(
  name: string,
  opts: ScaffoldSkillOptions,
): Promise<void> {
  const cwd = process.cwd();
  const runtime = await HarnessRuntime.create();

  await runtime.dispatchHooks("scaffold.pre", {
    command: "scaffold",
    type: "skill",
    name,
  });

  let targetDir = resolve(cwd, ".harness/skills");
  if (projectConfigExists(cwd)) {
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

  await runtime.dispatchHooks("scaffold.post", {
    command: "scaffold",
    type: "skill",
    name,
    skillDir,
  });
  await runtime.log("scaffold", `Skill "${name}" scaffolded`, {
    name,
    skillDir,
  });

  console.log(`Skill scaffolded at ${skillDir}`);
  console.log("\nFiles created:");
  console.log("  SKILL.md         — Skill definition with frontmatter");
  console.log("  metadata.yaml    — Skill metadata for discovery");
}
