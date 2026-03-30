import type { ToolpackPlugin } from "./plugin.js";
import type { ToolpackProvenance } from "./plugin.js";

/** Stable ids for Phase 4 official builtin toolpacks (see `docs/OFFICIAL-TOOLPACKS.md`). */
export const OFFICIAL_TOOLPACK_IDS = ["context-mode", "rtk", "understand-anything", "gstack"] as const;

export type OfficialToolpackId = (typeof OFFICIAL_TOOLPACK_IDS)[number];

/** One row aligned with `.planning/phases/03-1-team-jobs-definition/TEAM-JOBS.md`. */
export interface OfficialToolpackCatalogEntry {
  id: OfficialToolpackId;
  /** TEAM-JOBS table: Job column */
  teamJob: string;
  icp: string;
  governanceSignal: string;
  userOutcome: string;
  candidateTheme: string;
  /** What this pack is expected to help teams produce when selected */
  expectedOutcome: string;
}

export function isOfficialToolpackId(id: string): id is OfficialToolpackId {
  return (OFFICIAL_TOOLPACK_IDS as readonly string[]).includes(id);
}

/**
 * Resolves provenance for registry / manifest. Explicit `plugin.provenance` wins;
 * builtin ids in the official catalog default to `official`; everything else is `community`.
 */
export function resolveToolpackProvenance(plugin: ToolpackPlugin): ToolpackProvenance {
  if (plugin.provenance !== undefined) {
    return plugin.provenance;
  }
  if (plugin.source === "builtin" && isOfficialToolpackId(plugin.id)) {
    return "official";
  }
  return "community";
}

/** Single source of truth for docs, index generator, and tests. */
export function getOfficialToolpackCatalog(): OfficialToolpackCatalogEntry[] {
  return [
    {
      id: "context-mode",
      teamJob: "CI harness health gate",
      icp: "B",
      governanceSignal: "`harn diagnose --json` + `jq .summary` (CI gate)",
      userOutcome:
        "Pipeline fails fast on invalid config, drift, or missing wiring without custom scripts",
      candidateTheme: "ci-health",
      expectedOutcome:
        "Merged Cursor MCP wiring for context-mode so local/CI diagnostics and MCP health checks stay consistent.",
    },
    {
      id: "rtk",
      teamJob: "Onboarding consistency across repos",
      icp: "A",
      governanceSignal: "`detectDrift` + `harn update` (refresh vs canonical)",
      userOutcome: "New or existing repos reach the same harness baseline without hand-copying per tool",
      candidateTheme: "repo-bootstrap",
      expectedOutcome:
        "RTK terminal compression / context tooling snippets aligned with repeatable harness baselines across repos.",
    },
    {
      id: "understand-anything",
      teamJob: "Skill sync across tools",
      icp: "A, C",
      governanceSignal: "Drift on mergeable `.harness/skills/**/SKILL.md` and distributed tool paths",
      userOutcome: "Skills stay aligned across Cursor, Claude Code, Codex, etc., after config changes",
      candidateTheme: "skill-sync",
      expectedOutcome:
        "Understand-Anything MCP wiring to support analysis and knowledge-style workflows alongside harness skills.",
    },
    {
      id: "gstack",
      teamJob: "PR / merge governance",
      icp: "A, B",
      governanceSignal: "`harn verify` + `harn diagnose --json` (CI gate)",
      userOutcome: "Merges only proceed when harness health and wiring pass automated checks",
      candidateTheme: "pr-governance",
      expectedOutcome:
        "gstack browse/QA/review/shipping skill packs and conventions that pair with verify/diagnose gates.",
    },
  ];
}
