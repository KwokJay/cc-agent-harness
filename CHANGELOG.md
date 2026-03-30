# Changelog

All notable changes to **cc-agent-harness** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Governance loop**: `detectDrift()` in `src/scaffold/differ.ts`; `harn diagnose` includes scaffold drift checks (`drift.<path>`). `harn update` / `harn verify` print follow-up tips; docs in `docs/MANIFEST.md` and README (Governance loop).
- **Migration `0.5.0`**: patch `add-generated-files-field` appends `generated_files: []` to `.harness/config.yaml` when missing (first non–no-op patch for this from-version).
- **Phase 2 — Core tool parity**: `TOOL_CAPABILITIES` / `ToolCapability` / `getToolCapability()` in `src/tool-adapters/types.ts`; each adapter exposes `capability`; `docs/CAPABILITY-MATRIX.md` mirrors code.
- **`harn diagnose`**: passes configured harness `tools` into checks; `.cursor/mcp.json` validation skipped when `cursor` is not in config (`mcp-json.skip-capability`).
- **Skill extraction**: `ExtractionSkipReason`, `describeExtractionSkip()` in `src/skill-extraction/invoker.ts`; explicit messages for missing CLI, no automation path, and tools outside automation priority list.
- **`harn init --skip-skill-extraction`**: skips Step 2 AI skill extraction (for deterministic CI / e2e).
- **Docs**: `docs/POSITIONING.md`, `docs/CAPABILITY-MATRIX.md`, `docs/GOLDEN-PATHS.md`; Phase 1 planning artifacts `ICP-VALIDATION.md`, `ROI-BASELINE.md`, and plan summaries under `.planning/phases/01-icp-and-golden-paths/`.

### Removed

- Internal roadmap files `PHASE2_PLAN.md`, `PHASE3_PLAN.md`, and `PHASE4_PLAN.md`; the Roadmap subsection was removed from README / README.zh-CN to avoid broken links.

## [0.7.0] - 2026-03-28

### Changed (Breaking)

- **CLI**: the published executable is now `harn` (see `package.json` `bin`). The previous binary name `agent-harness` is removed. The npm package name is unchanged: `cc-agent-harness` (`npm install -g cc-agent-harness`).

## [0.6.0] - 2026-03-27

### Added

- **Harness manifest**: `.harness/manifest.json` with `manifestVersion`, project/tools/toolpacks/skills/verification summary; JSON Schema `schemas/harness-manifest.json`. Written on `init` / `update` and via `agent-harness manifest`.
- **`agent-harness export`**: Markdown or JSON summary (`-f json|md`, `-o file`) from the same builder as the manifest.
- **`agent-harness diagnose`**: Pluggable deep checks (config, verification wiring, skill distribution, `.cursor/mcp.json` JSON, writable dirs); `--json`, optional `--run-verify`.
- **`agent-harness migrate <fromVersion>`**: Registered migration plans; default dry-run, `--apply` to run patches.
- **`harness-inventory`**: Shared skill discovery and tool path helpers (used by `doctor`, manifest, diagnose).
- **`SECURITY.md`**, **Changesets** (`.changeset/config.json`, `pnpm changeset`, release workflow), **`docs/toolpacks-index.md`** + `pnpm run generate:toolpack-index` / `check:toolpack-index`.
- **Perf regression test**: `tests/perf/resolver-perf.test.ts` (resolve budget).
- **Docs**: `docs/MANIFEST.md`, `docs/ci-manifest-example.yml`.
- **npm package**: `package.json` `files` now ships `docs/` (with `dist` and `schemas`) so installed packages include manifest docs and toolpack index.

## [0.5.0] - 2026-03-26

### Added

- **Phase 3 (scaffold + light runtime conventions)**  
  - Shared verification copy: `buildVerificationSteps` / `buildVerificationCheckLines` in `src/workflows/verification-copy.ts` (AGENTS.md and generated docs stay aligned with `verify`).  
  - **Generated files**: `.harness/workflows/ralph-loop.md`, `.harness/workflows/multi-agent-patterns.md`, `.harness/recommended-tools.md`, `.harness/state/harness-version.txt`.  
  - **AGENTS.md**: links to workflow docs + context/memory placeholder.  
  - **`agent-harness mcp merge`**: merge one MCP server into `.cursor/mcp.json` (stdin or `--file`, `--dry-run`).  
  - **`src/mcp/cursor-mcp.ts`**: shared merge helpers (used by `context-mode` toolpack).  
  - **`schemas/cursor-mcp.json`**: minimal Cursor `mcpServers` schema (published with package).  
  - **npm toolpack discovery**: packages named `@agent-harness/toolpack-*` or `agent-harness-toolpack-*` with `agent-harness.toolpack` in `package.json`; `list toolpacks` shows `source=npm`.  
  - **`docs/TOOLPACK-AUTHOR.md`**: author contract for npm toolpacks.  
  - **`verify` state**: writes `.harness/state/last-verify.json`; **`doctor`** warns if missing, last run failed, or older than 7 days.  
  - **`loadHarnessConfig`**, **`getHarnessVersion`** (walk-up `package.json` resolution for tests + dist).  
  - **Monorepo / workspace**: `getWorkspacePackageDirs` exported; `PROJECT-ANALYSIS.md` lists packages; `EXTRACTION-TASK.md` + `invokeSkillExtraction` prompt hint for per-package skills.

### Changed

- **Toolpack merge order**: builtin → npm → local (later sources override same `id`).  
- **CLI `--version`**: uses `getHarnessVersion()` from package metadata.

## [0.4.0] - 2026-03-26

### Added

- **`verify` CLI**: reads `.harness/config.yaml`, validates schema, then runs `workflows.verification.checks` in order using `workflows.commands` entries (`spawnSync` with `shell: true`, `stdio: inherit`).
- **`doctor --verify`**: after a passing doctor run (no fail-level checks), runs the same verification pipeline as `verify`.
- **`update --dry-run`**: when `generated_files` is present in config, prints paths that would drop out of the harness plan (via `diffPlan` `removed`).
- **Toolpack registry**: built from `discoverToolpacks(cwd)`; `list toolpacks` shows `source` (builtin/local) and `version`.
- **Skill merge + `body_hash`**: harness `SKILL.md` files merge on write; `body_hash` persisted for manual-edit detection (Phase 2).
- **Templates**: `PROJECT-ANALYSIS.md`, `INDEX.md`, and `EXTRACTION-TASK.md` bodies live under `src/templates/skills/` with snapshot tests.
- **E2E**: `tests/e2e/cli-smoke.test.ts` (requires `pnpm build`); `vitest.e2e.config.ts`.
- **Coverage**: `@vitest/coverage-v8`; `pnpm test:coverage` enforces thresholds from `vitest.config.ts`.

### Changed

- **`pnpm agent-review`**: `pnpm lint && pnpm test:coverage && pnpm build && pnpm test:e2e`.
- **`pnpm verify`**: `pnpm lint && pnpm test && pnpm build && pnpm test:e2e` (unit tests exclude e2e; e2e runs separately).
- **`ToolpackCategory`** moved to `src/toolpacks/categories.ts` to avoid circular imports.

## [0.2.0] - 2026-03-26

### Added

- `pnpm verify` / `pnpm agent-review`: single gate running lint, test, and build; `prepublishOnly` now uses this gate
- `CONTRIBUTING.md` and Cursor rule `.cursor/rules/agent-review-and-verify.mdc` documenting mandatory agent self-review + verify before task completion
- CI runs `pnpm agent-review` as one step (same as local gate)
- `PHASE3_PLAN.md` and `PHASE4_PLAN.md` roadmap documents; `PHASE2_PLAN.md` cross-links all phases
- Complete rewrite as a harness scaffold tool
- Interactive init flow with step-by-step prompts (project type, AI tools, toolpacks)
- Non-interactive mode via CLI parameters for CI/automation
- 5 project type adapters: frontend, backend, fullstack, monorepo, docs
- 5 AI tool adapters: Cursor, Claude Code, Copilot, Codex, OpenCode
- Workspace/monorepo auto-detection with sub-project scanning
- Multi-language detection: TypeScript, Python, Go, Rust, Java, Swift, Elixir, Dart, Ruby, PHP, Zig, and docs frameworks
- Skill distribution to each tool's native path (.cursor/rules/, .claude/skills/, .agents/skills/, .opencode/skills/, .github/instructions/)
- Two-step skill extraction: static analysis + AI-powered deep extraction using skill-creator
- skill-creator as mandatory init component
- project-skill-extractor for automated project analysis
- Auto-generated CHANGELOG.md from git history with noise filtering and categorization
- changelog-governance skill for enforcing continuous changelog maintenance
- docs-governance skill for enforcing documentation placement under .harness/docs/{feature}/
- Optional toolpacks system: context-mode, rtk, understand-anything, gstack
- doctor command with --json output
- update command to refresh generated files

### Changed

- Renamed from "project configuration tool" to "harness scaffold tool"
- Skills now use each tool's documented native directory format
- Documentation and changelog constraints are injected into AGENTS.md and each tool's rule files

### Notes

- This is a breaking change from 0.0.1. The entire API and CLI have been rewritten.

## [0.0.1] - 2026-03-25

### Added

- Initial release as project configuration management tool
- Basic CLI with setup, doctor, verify, run, context build commands
- HarnessRuntime for unified configuration and task resolution
