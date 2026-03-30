import type { DetectedProject } from "../project-types/types.js";
import type { SkillSource } from "../skill-extraction/parser.js";

export type ToolId = "cursor" | "claude-code" | "copilot" | "codex" | "opencode" | "windsurf" | "trae" | "augment";

/** Product tier: first-class tools get full automation and documentation focus. */
export type SupportTier = "first-class" | "baseline";

/**
 * Code-level capability truth for each tool (single source for docs, diagnose, extraction messaging).
 * - `diagnose`: harness includes tool-specific diagnostic coverage (e.g. Cursor MCP JSON).
 * - `mcp`: `harn mcp merge` targets this tool (Cursor `.cursor/mcp.json` only today).
 * - `extractionAuto`: invoker can run an automated CLI extraction command for this tool.
 */
export interface ToolCapability {
  tier: SupportTier;
  generation: true;
  diagnose: boolean;
  mcp: boolean;
  extractionAuto: boolean;
  extractionManualFallback: true;
}

/** Canonical capability rows — keep in sync with adapter registrations. */
export const TOOL_CAPABILITIES: Record<ToolId, ToolCapability> = {
  cursor: {
    tier: "first-class",
    generation: true,
    diagnose: true,
    mcp: true,
    extractionAuto: false,
    extractionManualFallback: true,
  },
  "claude-code": {
    tier: "first-class",
    generation: true,
    diagnose: true,
    mcp: false,
    extractionAuto: true,
    extractionManualFallback: true,
  },
  codex: {
    tier: "first-class",
    generation: true,
    diagnose: true,
    mcp: false,
    extractionAuto: true,
    extractionManualFallback: true,
  },
  copilot: {
    tier: "baseline",
    generation: true,
    diagnose: false,
    mcp: false,
    extractionAuto: false,
    extractionManualFallback: true,
  },
  opencode: {
    tier: "baseline",
    generation: true,
    diagnose: false,
    mcp: false,
    extractionAuto: false,
    extractionManualFallback: true,
  },
  windsurf: {
    tier: "baseline",
    generation: true,
    diagnose: false,
    mcp: false,
    extractionAuto: false,
    extractionManualFallback: true,
  },
  trae: {
    tier: "baseline",
    generation: true,
    diagnose: false,
    mcp: false,
    extractionAuto: false,
    extractionManualFallback: true,
  },
  augment: {
    tier: "baseline",
    generation: true,
    diagnose: false,
    mcp: false,
    extractionAuto: false,
    extractionManualFallback: true,
  },
};

export function getToolCapability(id: ToolId): ToolCapability {
  return TOOL_CAPABILITIES[id];
}

export interface GeneratedFile {
  path: string;
  content: string;
  description: string;
  source?: "preset" | "extracted" | "tool-adapter" | "harness-config";
  /** When set, drives merge metadata for harness SKILL.md paths in generateFiles. */
  harnessSkillSource?: SkillSource;
}

export interface SkillContent {
  name: string;
  description: string;
  body: string;
}

export interface ToolAdapterContext {
  projectName: string;
  project: DetectedProject;
  agentsMdContent: string;
  commands: Record<string, string>;
  verificationChecks: string[];
  customRules: string[];
  skills: string[];
  skillContents: SkillContent[];
}

export interface ToolAdapter {
  id: ToolId;
  label: string;
  /** Declared support surface — must match {@link TOOL_CAPABILITIES}[id]. */
  capability: ToolCapability;
  generate(ctx: ToolAdapterContext): GeneratedFile[];
}

export const ALL_TOOL_IDS: ToolId[] = ["cursor", "claude-code", "copilot", "codex", "opencode", "windsurf", "trae", "augment"];
