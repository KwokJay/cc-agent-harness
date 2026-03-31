# Changelog

All notable changes to **cc-agent-harness** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

_No unreleased changes yet._

## [2026-03] - 2026-03-30

### Documentation

- Complete README CLI reference and align zh-CN
- Add Phase 3 and Phase 4 roadmap; link from Phase 2 and README
- Add Phase 2 roadmap (skill merge in generator, verify CLI, e2e)
- Add bilingual README and getting started guide

### Fixed

- Preserve harness update config overrides
- Remove test from prepublishOnly (no test files after rewrite)
- Cascade through tools by priority, skip uninstalled, fix codex exec
- Use correct native skill paths for each AI tool
- Distribute auto-extracted skills to each tool's native path
- Remove changelog/ from docs directory convention
- Rename docs directory convention from module to feature
- Docs scaffold generates constraints only, not directories
- Reorganize docs scaffold under .harness/docs/{module} with templates
- Align CLI version with package.json 0.0.1

### Configuration

- Gitignore o-research.md
- Untrack o-research.md and ignore locally
- Remove internal PHASE plan files and README roadmap links
- Prepare 0.2.0 release — rewrite docs, changelog, bump version
- Prepare cc-agent-harness 0.0.1 release

### Added

- Cli)!: rename binary to harn (v0.7.0)
- Phase 4 — manifest, export, diagnose, migrate, governance (v0.6.0)
- Phase 3 — MCP merge CLI, npm toolpacks, verify state, workflow docs (v0.5.0)
- Phase 2 — skill merge, verify CLI, toolpack registry, templates, E2E, coverage gate
- Phase 1 foundation hardening and agent-review gate
- Auto-detect workspace sub-projects with multi-language support
- Interactive init flow with step-by-step prompts
- Two-step skill extraction using skill-creator
- Auto-generate changelog from git history with governance rules
- Auto-extract skills from project during init
- Enhance init with toolpacks, skill-creator, docs scaffold, and skill extraction
- Distribute skill content to each tool's native rule path
- : rewrite as harness scaffold tool
- Add harness runtime, context CLI, and integration guardrails
- Dev paradigm evolution — pipeline verification, schema generation, context tags, feature lifecycle, and run command

### Refactored

- Decouple from codex, generalize model tiers, wire dead code, and add core extension systems

### Other

- Initial commit: agent-harness v0.1.0
