import { execSync } from "node:child_process";
import type { ToolId } from "../tool-adapters/types.js";
import { getWorkspacePackageDirs } from "../project-types/scanner.js";

const TOOL_PRIORITY: ToolId[] = ["claude-code", "codex", "cursor", "copilot", "opencode"];
const PRIORITY_SET = new Set<ToolId>(TOOL_PRIORITY);

/** Why automated extraction did not run for a tool. */
export type ExtractionSkipReason =
  | "extraction-not-supported"
  | "cli-not-installed"
  | "not-in-user-tools";

export interface ExtractionSkipped {
  tool: ToolId;
  reason: ExtractionSkipReason;
  /** Extra context (e.g. expected binary name). */
  detail?: string;
}

interface InvokeResult {
  tool: ToolId | null;
  success: boolean;
  output: string;
  skipped: ExtractionSkipped[];
}

/** Human-readable line for console / logs. */
export function describeExtractionSkip(s: ExtractionSkipped): string {
  switch (s.reason) {
    case "extraction-not-supported":
      return "no automated CLI for this tool — use manual step in .harness/skills/EXTRACTION-TASK.md or pick Claude Code / Codex in priority list";
    case "cli-not-installed":
      return `CLI not in PATH (expected: ${s.detail ?? "see docs"}) — install the vendor CLI or use manual extraction`;
    case "not-in-user-tools":
      return s.detail ?? "tool is not in the automated extraction priority list";
    default:
      return s.reason;
  }
}

export function invokeSkillExtraction(cwd: string, userTools: ToolId[]): InvokeResult {
  const skipped: ExtractionSkipped[] = [];

  for (const tool of userTools) {
    if (!PRIORITY_SET.has(tool)) {
      skipped.push({
        tool,
        reason: "not-in-user-tools",
        detail: "not in automated extraction priority (claude-code, codex, cursor, copilot, opencode)",
      });
    }
  }

  for (const tool of TOOL_PRIORITY) {
    if (!userTools.includes(tool)) continue;

    const command = buildExtractionCommand(tool, cwd);
    if (!command) {
      skipped.push({ tool, reason: "extraction-not-supported" });
      continue;
    }

    if (!isToolInstalled(tool)) {
      const bin = getBinName(tool);
      skipped.push({
        tool,
        reason: "cli-not-installed",
        detail: bin ?? undefined,
      });
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

function workspaceExtractionHint(cwd: string): string {
  const pkgs = getWorkspacePackageDirs(cwd);
  if (pkgs.length < 2) return "";
  const sample = pkgs.slice(0, 25).join(", ");
  const more = pkgs.length > 25 ? ` (+${pkgs.length - 25} more)` : "";
  return ` This monorepo lists workspace packages: ${sample}${more}. When patterns differ by package, prefer separate skills or clearly scoped sections per package.`;
}

function buildExtractionCommand(tool: ToolId, cwd: string): string | null {
  const prompt = [
    "Read the file .harness/skills/PROJECT-ANALYSIS.md for the static analysis of this project.",
    "Then read .harness/skills/skill-creator/SKILL.md to understand how to create high-quality skills.",
    "Based on both, extract project-specific skills following the process in .harness/skills/project-skill-extractor/SKILL.md.",
    "Create each skill as a directory under .harness/skills/ with a SKILL.md file.",
    "After creating all skills, update .harness/skills/INDEX.md.",
    workspaceExtractionHint(cwd),
  ]
    .join(" ")
    .trim();

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
