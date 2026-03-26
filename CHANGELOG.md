# Changelog

All notable changes to **cc-agent-harness** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - 2026-03-26

### Added
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
