import { basename } from "node:path";
import { resolve } from "../scaffold/resolver.js";
import { generateFiles } from "../scaffold/generator.js";
import { detectProjectType, ALL_PROJECT_TYPE_IDS } from "../project-types/index.js";
import { ALL_TOOL_IDS } from "../tool-adapters/index.js";
import type { ProjectTypeId } from "../project-types/types.js";
import type { ToolId } from "../tool-adapters/types.js";

export interface InitOptions {
  project?: string;
  tools?: string;
  name?: string;
  toolpacks?: string;
  skipDocs?: boolean;
  overwrite?: boolean;
}

export async function runInit(opts: InitOptions): Promise<void> {
  const cwd = process.cwd();
  const projectName = opts.name ?? (basename(cwd) || "my-project");

  console.log("Agent Harness Init");
  console.log("==================\n");

  const projectType = resolveProjectType(opts.project, cwd);
  const tools = resolveTools(opts.tools);
  const toolpacks = opts.toolpacks
    ? opts.toolpacks.split(",").map((t) => t.trim())
    : [];

  console.log(`  Project:    ${projectName}`);
  console.log(`  Type:       ${projectType}`);
  console.log(`  Tools:      ${tools.join(", ")}`);
  console.log(`  Toolpacks:  ${toolpacks.length > 0 ? toolpacks.join(", ") : "(none)"}`);
  console.log(`  Docs:       ${opts.skipDocs ? "skipped" : "included"}`);
  console.log("");

  const plan = resolve({
    cwd,
    projectName,
    projectType,
    tools,
    toolpacks,
    skipDocs: opts.skipDocs,
  });

  console.log(`  Detected: ${plan.project.type} (${plan.project.language}${plan.project.framework ? ` / ${plan.project.framework}` : ""})`);
  console.log(`  Signals:  ${plan.project.signals.join(", ")}`);
  console.log(`  Files:    ${plan.files.length} to generate`);
  console.log("");

  const result = await generateFiles(cwd, plan.files, { overwrite: opts.overwrite });

  if (result.created.length > 0) {
    console.log("  Created:");
    for (const f of result.created) {
      console.log(`    ${f}`);
    }
  }

  if (result.skipped.length > 0) {
    console.log("  Skipped (already exist):");
    for (const f of result.skipped) {
      console.log(`    ${f}`);
    }
  }

  console.log(`\nInit complete! ${result.created.length} file(s) created, ${result.skipped.length} skipped.`);

  if (tools.includes("cursor")) {
    console.log("\n  Cursor:      .cursor/rules/ ready");
  }
  if (tools.includes("claude-code")) {
    console.log("  Claude Code: CLAUDE.md ready (imports AGENTS.md)");
  }
  if (tools.includes("copilot")) {
    console.log("  Copilot:     .github/copilot-instructions.md ready");
  }
  if (tools.includes("codex")) {
    console.log("  Codex:       .codex/config.toml ready");
  }
  if (tools.includes("opencode")) {
    console.log("  OpenCode:    opencode.json ready");
  }
}

function resolveProjectType(input: string | undefined, cwd: string): ProjectTypeId {
  if (input) {
    if (!ALL_PROJECT_TYPE_IDS.includes(input as ProjectTypeId)) {
      console.error(`Unknown project type: ${input}`);
      console.error(`Available: ${ALL_PROJECT_TYPE_IDS.join(", ")}`);
      process.exit(1);
    }
    return input as ProjectTypeId;
  }

  const detected = detectProjectType(cwd);
  return detected.type;
}

function resolveTools(input: string | undefined): ToolId[] {
  if (!input) {
    return ["cursor", "claude-code"];
  }

  const tools = input.split(",").map((t) => t.trim()) as ToolId[];
  for (const tool of tools) {
    if (!ALL_TOOL_IDS.includes(tool)) {
      console.error(`Unknown tool: ${tool}`);
      console.error(`Available: ${ALL_TOOL_IDS.join(", ")}`);
      process.exit(1);
    }
  }
  return tools;
}
