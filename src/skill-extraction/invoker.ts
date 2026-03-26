import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import type { ToolId } from "../tool-adapters/types.js";

const TOOL_PRIORITY: ToolId[] = ["claude-code", "codex", "cursor", "copilot", "opencode"];

interface InvokeResult {
  tool: ToolId;
  success: boolean;
  output: string;
}

export function selectExtractionTool(userTools: ToolId[]): ToolId | null {
  for (const tool of TOOL_PRIORITY) {
    if (userTools.includes(tool)) return tool;
  }
  return null;
}

export function invokeSkillExtraction(
  cwd: string,
  tool: ToolId,
): InvokeResult {
  const command = buildExtractionCommand(tool);
  if (!command) {
    return { tool, success: false, output: `No extraction command available for ${tool}` };
  }

  if (!isToolAvailable(tool)) {
    return { tool, success: false, output: `${tool} CLI not found in PATH. Install it first, then run: ${command}` };
  }

  console.log(`  Invoking ${tool} for skill extraction...`);
  console.log(`  Command: ${command}`);
  console.log("");

  try {
    const output = execSync(command, {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 300_000,
      env: { ...process.env, FORCE_COLOR: "0" },
    }).toString();

    return { tool, success: true, output };
  } catch (err) {
    const execErr = err as { stdout?: Buffer; stderr?: Buffer; message?: string };
    const output = execErr.stderr?.toString() ?? execErr.stdout?.toString() ?? execErr.message ?? "Unknown error";
    return { tool, success: false, output };
  }
}

function buildExtractionCommand(tool: ToolId): string | null {
  const prompt = [
    "Read the file .harness/skills/PROJECT-ANALYSIS.md for the static analysis of this project.",
    "Then read .harness/skills/skill-creator/SKILL.md to understand how to create high-quality skills.",
    "Based on both, extract project-specific skills following the process in .harness/skills/project-skill-extractor/SKILL.md.",
    "Create each skill as a directory under .harness/skills/ with a SKILL.md file.",
    "After creating all skills, update .harness/skills/INDEX.md.",
  ].join(" ");

  switch (tool) {
    case "claude-code":
      return `claude -p "${prompt}"`;
    case "codex":
      return `codex -q "${prompt}"`;
    case "cursor":
      return null;
    case "copilot":
      return null;
    case "opencode":
      return null;
    default:
      return null;
  }
}

function isToolAvailable(tool: ToolId): boolean {
  const binMap: Record<string, string> = {
    "claude-code": "claude",
    codex: "codex",
    cursor: "cursor",
    copilot: "gh",
    opencode: "opencode",
  };

  const bin = binMap[tool];
  if (!bin) return false;

  try {
    execSync(`which ${bin}`, { stdio: "pipe", timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}
