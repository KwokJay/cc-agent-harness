import { basename } from "node:path";
import { resolve } from "../scaffold/resolver.js";
import { generateFiles } from "../scaffold/generator.js";
import { detectProjectType, ALL_PROJECT_TYPE_IDS } from "../project-types/index.js";
import { listToolAdapters, ALL_TOOL_IDS } from "../tool-adapters/index.js";
import { getOptionalToolpacks } from "../toolpacks/registry.js";
import type { ProjectTypeId } from "../project-types/types.js";
import type { ToolId } from "../tool-adapters/types.js";
import { invokeSkillExtraction } from "../skill-extraction/invoker.js";

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

  const isInteractive = !opts.project && !opts.tools;

  let projectName: string;
  let projectType: ProjectTypeId;
  let tools: ToolId[];
  let toolpacks: string[];
  let skipDocs: boolean;

  if (isInteractive) {
    console.log("Agent Harness Init");
    console.log("==================\n");

    const detected = detectProjectType(cwd);
    console.log(`  Detected project: ${detected.type} (${detected.language}${detected.framework ? ` / ${detected.framework}` : ""})`);
    console.log(`  Signals: ${detected.signals.join(", ")}`);

    if (detected.subProjects && detected.subProjects.length > 0) {
      console.log("");
      console.log(`  Sub-projects found (${detected.subProjects.length}):`);
      for (const sub of detected.subProjects) {
        console.log(`    ${sub.path.padEnd(30)} ${sub.type} (${sub.language}${sub.framework ? ` / ${sub.framework}` : ""})`);
      }
    }
    console.log("");

    const inquirer = await import("@inquirer/prompts");

    projectName = await inquirer.input({
      message: "Project name:",
      default: basename(cwd) || "my-project",
    });

    projectType = await inquirer.select({
      message: "Project type:",
      choices: ALL_PROJECT_TYPE_IDS.map((id) => ({
        name: id === detected.type ? `${id} (detected)` : id,
        value: id,
      })),
      default: detected.type,
    }) as ProjectTypeId;

    const allTools = listToolAdapters();
    tools = await inquirer.checkbox({
      message: "Select AI coding tools:",
      choices: allTools.map((t) => ({
        name: t.label,
        value: t.id as ToolId,
        checked: t.id === "cursor" || t.id === "claude-code",
      })),
      required: true,
    });

    const allPacks = getOptionalToolpacks();
    if (allPacks.length > 0) {
      toolpacks = await inquirer.checkbox({
        message: "Optional toolpacks (press enter to skip):",
        choices: allPacks.map((p) => ({
          name: `${p.name} — ${p.description}`,
          value: p.id,
        })),
      });
    } else {
      toolpacks = [];
    }

    skipDocs = false;

    console.log("");
    console.log("  Summary:");
    console.log(`    Project:    ${projectName}`);
    console.log(`    Type:       ${projectType}`);
    console.log(`    Tools:      ${tools.join(", ")}`);
    console.log(`    Toolpacks:  ${toolpacks.length > 0 ? toolpacks.join(", ") : "(none)"}`);
    console.log("");

    const confirmed = await inquirer.confirm({
      message: "Proceed with initialization?",
      default: true,
    });

    if (!confirmed) {
      console.log("  Cancelled.");
      return;
    }
  } else {
    projectName = opts.name ?? (basename(cwd) || "my-project");
    projectType = resolveProjectType(opts.project, cwd);
    tools = resolveTools(opts.tools);
    toolpacks = opts.toolpacks ? opts.toolpacks.split(",").map((t) => t.trim()) : [];
    skipDocs = opts.skipDocs ?? false;

    console.log("Agent Harness Init");
    console.log("==================\n");
    console.log(`  Project:    ${projectName}`);
    console.log(`  Type:       ${projectType}`);
    console.log(`  Tools:      ${tools.join(", ")}`);
    console.log(`  Toolpacks:  ${toolpacks.length > 0 ? toolpacks.join(", ") : "(none)"}`);
    console.log(`  Docs:       ${skipDocs ? "skipped" : "included"}`);
    console.log("");
  }

  const plan = resolve({
    cwd,
    projectName,
    projectType,
    tools,
    toolpacks,
    skipDocs,
  });

  console.log(`  Detected: ${plan.project.type} (${plan.project.language}${plan.project.framework ? ` / ${plan.project.framework}` : ""})`);
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

  for (const tool of tools) {
    const labels: Record<ToolId, string> = {
      cursor: "Cursor:      .cursor/rules/ ready",
      "claude-code": "Claude Code: CLAUDE.md + .claude/skills/ ready",
      copilot: "Copilot:     .github/copilot-instructions.md ready",
      codex: "Codex:       .codex/config.toml + .agents/skills/ ready",
      opencode: "OpenCode:    opencode.json + .opencode/skills/ ready",
    };
    console.log(`  ${labels[tool]}`);
  }

  console.log("\n--- Skill Extraction (Step 2: AI-powered) ---\n");

  const extractionResult = invokeSkillExtraction(cwd, tools);

  for (const skip of extractionResult.skipped) {
    console.log(`  [SKIP] ${skip.tool}: ${skip.reason}`);
  }

  if (extractionResult.success && extractionResult.tool) {
    console.log(`  [OK]   Skill extraction via ${extractionResult.tool} completed.`);
  } else if (extractionResult.tool) {
    console.log(`  [FAIL] ${extractionResult.tool}: ${extractionResult.output}`);
    console.log("");
    console.log("  To extract skills manually, open your AI tool and run:");
    console.log(`  "Read .harness/skills/EXTRACTION-TASK.md and execute the task"`);
  } else {
    console.log("");
    console.log("  No usable AI tool CLI found for automatic skill extraction.");
    console.log("  To extract skills manually, open your AI tool and run:");
    console.log(`  "Read .harness/skills/EXTRACTION-TASK.md and execute the task"`);
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
  return detectProjectType(cwd).type;
}

function resolveTools(input: string | undefined): ToolId[] {
  if (!input) return ["cursor", "claude-code"];
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
