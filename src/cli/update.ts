import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { resolve as resolveScaffold } from "../scaffold/resolver.js";
import { generateFiles } from "../scaffold/generator.js";
import type { ProjectTypeId } from "../project-types/types.js";
import type { ToolId } from "../tool-adapters/types.js";

export interface UpdateOptions {
  overwrite?: boolean;
}

export async function runUpdate(opts: UpdateOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const configPath = resolve(cwd, ".harness/config.yaml");

  if (!existsSync(configPath)) {
    console.log("No .harness/config.yaml found. Run `agent-harness init` first.");
    process.exitCode = 1;
    return;
  }

  console.log("Agent Harness Update");
  console.log("====================\n");

  const config = parseYaml(readFileSync(configPath, "utf-8")) as Record<string, unknown>;
  const project = config.project as Record<string, string> | undefined;
  const projectName = project?.name ?? basename(cwd);
  const projectType = (project?.type ?? "backend") as ProjectTypeId;
  const tools = ((config.tools as string[]) ?? ["cursor", "claude-code"]) as ToolId[];

  const plan = resolveScaffold({
    cwd,
    projectName,
    projectType,
    tools,
  });

  const result = await generateFiles(cwd, plan.files, { overwrite: opts.overwrite ?? true });

  if (result.created.length > 0) {
    console.log("  Updated:");
    for (const f of result.created) {
      console.log(`    ${f}`);
    }
  }

  console.log(`\nUpdate complete! ${result.created.length} file(s) refreshed.`);
}
