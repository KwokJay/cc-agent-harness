import { execSync } from "node:child_process";
import type { ToolId } from "../tool-adapters/types.js";

const TOOL_PRIORITY: ToolId[] = ["claude-code", "codex", "cursor", "copilot", "opencode"];

interface InvokeResult {
  tool: ToolId | null;
  success: boolean;
  output: string;
  skipped: { tool: ToolId; reason: string }[];
}

export function invokeSkillExtraction(
  cwd: string,
  userTools: ToolId[],
): InvokeResult {
  const skipped: { tool: ToolId; reason: string }[] = [];

  for (const tool of TOOL_PRIORITY) {
    if (!userTools.includes(tool)) continue;

    const command = buildExtractionCommand(tool);
    if (!command) {
      skipped.push({ tool, reason: "no CLI extraction command available" });
      continue;
    }

    if (!isToolInstalled(tool)) {
      skipped.push({ tool, reason: `CLI not found in PATH (expected: ${getBinName(tool)})` });
      continue;
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

      return { tool, success: true, output, skipped };
    } catch (err) {
      const execErr = err as { stdout?: Buffer; stderr?: Buffer; message?: string };
      const output = execErr.stderr?.toString() ?? execErr.stdout?.toString() ?? execErr.message ?? "Unknown error";
      return { tool, success: false, output, skipped };
    }
  }

  return { tool: null, success: false, output: "No usable AI tool found for skill extraction", skipped };
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
      return `claude -p '${prompt}'`;
    case "codex":
      return `codex exec '${prompt}'`;
    case "cursor":
    case "copilot":
    case "opencode":
      return null;
    default:
      return null;
  }
}

function isToolInstalled(tool: ToolId): boolean {
  const bin = getBinName(tool);
  if (!bin) return false;

  try {
    execSync(`which ${bin}`, { stdio: "pipe", timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

function getBinName(tool: ToolId): string | null {
  const map: Record<string, string> = {
    "claude-code": "claude",
    codex: "codex",
    cursor: "cursor",
    copilot: "gh",
    opencode: "opencode",
  };
  return map[tool] ?? null;
}
