import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { loadConfig, configExists } from "../config/loader.js";
import { render } from "../template/engine.js";
import { getTemplatesDir } from "./utils.js";

export interface UpdateOptions {
  check?: boolean;
  template?: string;
}

export async function runUpdate(opts: UpdateOptions): Promise<void> {
  const cwd = process.cwd();
  const dryRun = opts.check ?? false;

  console.log(`Agent Harness Update${dryRun ? " (dry-run)" : ""}`);
  console.log("====================\n");

  if (!configExists(cwd)) {
    console.log("  No harness configuration found. Run `agent-harness setup` first.");
    return;
  }

  const config = await loadConfig({ cwd });
  const templatesDir = getTemplatesDir();

  if (!opts.template || opts.template === "agents-md") {
    await updateAgentsMd(cwd, config, templatesDir, dryRun);
  }

  console.log(dryRun ? "\nDry-run complete. No files modified." : "\nUpdate complete.");
}

async function updateAgentsMd(
  cwd: string,
  config: Awaited<ReturnType<typeof loadConfig>>,
  templatesDir: string,
  dryRun: boolean,
): Promise<void> {
  const variant = config.templates.agents_md.variant;
  const templateFile = join(templatesDir, "agents-md", `${variant}.md.tmpl`);

  if (!existsSync(templateFile)) {
    console.log(`  Template ${variant}.md.tmpl not found — skipping AGENTS.md.`);
    return;
  }

  const template = await readFile(templateFile, "utf-8");
  const rendered = render(template, {
    projectName: config.project.name,
    language: config.project.language,
    delegationFirst: String(config.agents.delegation_first),
  });

  const agentsMdPath = resolve(cwd, "AGENTS.md");
  if (existsSync(agentsMdPath)) {
    const current = await readFile(agentsMdPath, "utf-8");
    if (current === rendered) {
      console.log("  AGENTS.md is up to date.");
      return;
    }
    console.log(`  AGENTS.md would be updated (${variant} variant).`);
  } else {
    console.log(`  AGENTS.md would be created (${variant} variant).`);
  }

  if (!dryRun) {
    await writeFile(agentsMdPath, rendered, "utf-8");
    console.log("  AGENTS.md updated.");
  }
}
