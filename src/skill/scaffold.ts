import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { render } from "../template/engine.js";

const SKILL_MD_TEMPLATE = `---
name: {{name}}
description: {{description}}
---

# {{displayName}}

## Overview

TODO: Describe what this skill does.

## Usage

TODO: Describe how to use this skill.
`;

export interface ScaffoldOptions {
  name: string;
  description: string;
  displayName: string;
  resources?: ("scripts" | "references" | "assets")[];
}

export async function scaffoldSkill(
  targetDir: string,
  options: ScaffoldOptions,
): Promise<string> {
  const skillDir = join(targetDir, options.name);

  await mkdir(skillDir, { recursive: true });

  const content = render(SKILL_MD_TEMPLATE, {
    name: options.name,
    description: options.description,
    displayName: options.displayName,
  });
  await writeFile(join(skillDir, "SKILL.md"), content, "utf-8");

  await mkdir(join(skillDir, "agents"), { recursive: true });
  await writeFile(
    join(skillDir, "agents", "openai.yaml"),
    `interface:\n  display_name: "${options.displayName}"\n  short_description: "${options.description}"\n`,
    "utf-8",
  );

  for (const res of options.resources ?? []) {
    await mkdir(join(skillDir, res), { recursive: true });
    await writeFile(join(skillDir, res, ".gitkeep"), "", "utf-8");
  }

  return skillDir;
}
