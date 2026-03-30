import type { ToolId, GeneratedFile } from "../tool-adapters/types.js";
import type { ToolpackCategory } from "./categories.js";

/** Machine-readable tier for registry and manifest (Phase 4). */
export type ToolpackProvenance = "official" | "community";

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
  /**
   * Defaults: official catalog builtins → `official`; npm/local → `community`.
   * Set explicitly when a builtin should not be treated as official.
   */
  provenance?: ToolpackProvenance;
  /** Optional hook for verify/diagnose or CI consumers (short string). */
  verificationHint?: string;
  /** Optional bullet list of expected user-visible outcomes. */
  expectedOutcomes?: string[];
  /**
   * When true, this pack is intended as **org-wide shared policy** (same npm package/version
   * across many repos), not a one-off repo customization. Registry and manifest expose this for docs/CI.
   */
  sharedPolicy?: boolean;
  generateFiles(tools: ToolId[], projectName: string, cwd: string): GeneratedFile[];
}
