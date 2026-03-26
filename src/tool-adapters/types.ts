import type { DetectedProject } from "../project-types/types.js";

export type ToolId = "cursor" | "claude-code" | "copilot" | "codex" | "opencode";

export interface GeneratedFile {
  path: string;
  content: string;
  description: string;
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
  generate(ctx: ToolAdapterContext): GeneratedFile[];
}

export const ALL_TOOL_IDS: ToolId[] = ["cursor", "claude-code", "copilot", "codex", "opencode"];
