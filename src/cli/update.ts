import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { projectConfigExists } from "../config/loader.js";
import type { HarnessConfig } from "../config/loader.js";
import { render } from "../template/engine.js";
import { getTemplatesDir } from "./utils.js";
import { HarnessRuntime } from "../runtime/harness.js";

export interface UpdateOptions {
  check?: boolean;
  template?: string;
}

export async function runUpdate(opts: UpdateOptions): Promise<void> {
  const cwd = process.cwd();
  const dryRun = opts.check ?? false;

  console.log(`Agent Harness Update${dryRun ? " (dry-run)" : ""}`);
  console.log("====================\n");

  if (!projectConfigExists(cwd)) {
    console.log("  No harness configuration found. Run `agent-harness setup` first.");
    return;
  }

  const runtime = await HarnessRuntime.create({ requireProjectConfig: true });
  const config = runtime.config;
  const templatesDir = getTemplatesDir();

  if (!config) {
    throw new Error("Runtime expected configuration but none was loaded.");
  }

  await runtime.dispatchHooks("update.pre", {
    command: "update",
    dryRun,
    template: opts.template ?? null,
  });

  if (!opts.template || opts.template === "agents-md") {
    await updateAgentsMd(cwd, config, templatesDir, dryRun);
  }

  await runtime.dispatchHooks("update.post", {
    command: "update",
    dryRun,
    template: opts.template ?? null,
  });
  await runtime.log("update", dryRun ? "Update dry-run completed" : "Update completed", {
    dryRun,
    template: opts.template ?? null,
  });

  console.log(dryRun ? "\nDry-run complete. No files modified." : "\nUpdate complete.");
}

async function updateAgentsMd(
  cwd: string,
  config: HarnessConfig,
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
    customRules: config.templates.agents_md.custom_rules,
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
