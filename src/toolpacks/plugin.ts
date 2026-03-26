import type { ToolId, GeneratedFile } from "../tool-adapters/types.js";
import type { ToolpackCategory } from "./registry.js";

export type ToolpackInstallMethod =
  | { type: "npm"; package: string }
  | { type: "brew"; formula: string }
  | { type: "git-clone"; repo: string }
  | { type: "plugin"; instructions: string };

export interface ToolpackPlugin {
  id: string;
  name: string;
  description: string;
  category: ToolpackCategory;
  version: string;
  source: "builtin" | "local";
  install: ToolpackInstallMethod;
  relevantTools: ToolId[];
  generateFiles(tools: ToolId[], projectName: string, cwd: string): GeneratedFile[];
}
