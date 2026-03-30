# Official toolpacks (Phase 4)

This document is the **human-readable** source for which builtin toolpacks are **official** and how they map to [TEAM-JOBS](../.planning/phases/03-1-team-jobs-definition/TEAM-JOBS.md). The same mapping is implemented in code as `getOfficialToolpackCatalog()` (`src/toolpacks/official.ts`) and appears in the generated [toolpacks index](./toolpacks-index.md).

## Scope

- **Official** here means: shipped as builtins in this repo, outcome-oriented, and listed in `OFFICIAL_TOOLPACK_IDS`.
- **Community** toolpacks are npm (`node_modules/@agent-harness/toolpack-*`) or local (`.harness/toolpacks/`); they default to `provenance: "community"` in the registry and manifest.
- Phase 4 does **not** include a marketplace or publishing pipeline; see `.planning/phases/04-official-toolpacks/04-CONTEXT.md`.

## TEAM-JOBS mapping

| Pack id | TEAM-JOBS row | ICP | Governance / Phase 3 signal | User outcome (summary) | Candidate theme |
|---------|----------------|-----|-----------------------------|-------------------------|-----------------|
| `context-mode` | CI harness health gate | B | `harn diagnose --json` + `jq .summary` | Pipeline fails fast on invalid config / drift / wiring | ci-health |
| `rtk` | Onboarding consistency across repos | A | `detectDrift` + `harn update` | Same harness baseline across repos without hand-copying | repo-bootstrap |
| `understand-anything` | Skill sync across tools | A, C | Drift on mergeable skills + distributed paths | Skills stay aligned across tools after changes | skill-sync |
| `gstack` | PR / merge governance | A, B | `harn verify` + `harn diagnose --json` | Merges only when harness health checks pass | pr-governance |

### Jobs not covered by a dedicated official pack (yet)

These TEAM-JOBS rows are primarily served by **core CLI** (`migrate`, `init`, drift, `AGENTS.md` scaffold). Future curated packs may adopt the draft themes:

| TEAM-JOBS row | Draft theme | Notes |
|---------------|-------------|--------|
| Safe config migration on upgrade | upgrade-safety | Use `harn migrate` + post-migrate `verify` |
| Contributor onboarding baseline | contributor-harness | Drift on `AGENTS.md` / per-tool rules |

## Machine-readable fields

- **`ToolpackPlugin.provenance`** — optional; defaults are resolved in `resolveToolpackProvenance()`.
- **`ToolpackPlugin.verificationHint`** / **`expectedOutcomes`** — optional; surfaced for authors and may flow into `.harness/manifest.json` (hint only).
- **Manifest** — each `toolpacks[]` entry may include `provenance` and `verificationHint`. See [MANIFEST.md](./MANIFEST.md).
