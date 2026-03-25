import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { stringify as yamlStringify } from "yaml";
import { detectLanguage } from "../adapter/detector.js";
import { render } from "../template/engine.js";
import { getTemplatesDir } from "./utils.js";

export interface SetupOptions {
  language?: string;
  template?: string;
}

export async function runSetup(opts: SetupOptions): Promise<void> {
  const cwd = process.cwd();
  const harnessDir = resolve(cwd, ".harness");

  console.log("Agent Harness Setup");
  console.log("===================\n");

  const language = opts.language ?? detectLanguage(cwd);
  const variant = opts.template ?? "standard";

  console.log(`  Detected language: ${language}`);
  console.log(`  Template variant:  ${variant}\n`);

  if (existsSync(harnessDir)) {
    console.log("  .harness/ directory already exists — updating configuration.\n");
  } else {
    await mkdir(harnessDir, { recursive: true });
    console.log("  Created .harness/ directory.");
  }

  const skillsDir = resolve(harnessDir, "skills");
  if (!existsSync(skillsDir)) {
    await mkdir(skillsDir, { recursive: true });
    console.log("  Created .harness/skills/ directory.");
  }

  const configPath = resolve(harnessDir, "harness.config.yaml");
  const projectName = cwd.split("/").pop() ?? "my-project";

  const config = {
    project: {
      name: projectName,
      language,
      description: "",
    },
    agents: {
      delegation_first: true,
      model_routing: {
        low: "haiku",
        medium: "sonnet",
        high: "opus",
      },
    },
    skills: {
      directories: [".codex/skills", ".harness/skills"],
      auto_detect: true,
    },
    workflows: {
      verification: {
        checks: ["build", "test", "lint"],
      },
    },
    templates: {
      agents_md: {
        variant,
      },
    },
  };

  await writeFile(configPath, yamlStringify(config), "utf-8");
  console.log("  Generated harness.config.yaml.");

  const agentsMdPath = resolve(cwd, "AGENTS.md");
  if (!existsSync(agentsMdPath)) {
    const templatesDir = getTemplatesDir();
    const templateFile = join(templatesDir, "agents-md", `${variant}.md.tmpl`);

    if (existsSync(templateFile)) {
      const template = await readFile(templateFile, "utf-8");
      const rendered = render(template, {
        projectName,
        language,
        delegationFirst: "true",
      });
      await writeFile(agentsMdPath, rendered, "utf-8");
      console.log(`  Generated AGENTS.md (${variant} variant).`);
    } else {
      console.log(`  Template ${variant}.md.tmpl not found — skipping AGENTS.md generation.`);
    }
  } else {
    console.log("  AGENTS.md already exists — skipping (use `agent-harness update` to refresh).");
  }

  console.log("\nSetup complete! Run `agent-harness doctor` to verify.");
}
