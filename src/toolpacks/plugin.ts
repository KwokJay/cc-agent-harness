import type { ToolId, GeneratedFile } from "../tool-adapters/types.js";
import type { ToolpackCategory } from "./categories.js";

export type ToolpackInstallMethod =
  | { type: "npm"; package: string }
  | { type: "brew"; formula: string }
  | { type: "git-clone"; repo: string; /** Full install line for setup guide; defaults to "git clone <repo>" */ command?: string }
  | { type: "plugin"; instructions: string };

export interface ToolpackPlugin {
  id: string;
  name: string;
  description: string;
  category: ToolpackCategory;
  version: string;
  source: "builtin" | "local" | "npm";
  /** When source is npm, the installing package name (for list/diagnostics). */
  npmPackage?: string;
  install: ToolpackInstallMethod;
  relevantTools: ToolId[];
  generateFiles(tools: ToolId[], projectName: string, cwd: string): GeneratedFile[];
}
