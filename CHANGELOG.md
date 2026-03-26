# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows early-stage semantic versioning.

## [0.0.1] - 2026-03-25

### Added
- Bilingual project documentation with `README.md`, `README.zh-CN.md`, and a detailed `docs/getting-started.md`.
- `HarnessRuntime` as a shared runtime layer for configuration loading, adapter detection, task resolution, hooks, audit logging, feature state evaluation, and context assembly.
- `agent-harness context build` for assembling hierarchical `AGENTS.md`, custom rules, and discovered skills into a reusable context artifact.
- `--json` output support for `agent-harness doctor` and `agent-harness verify`.
- Feature observability via `agent-harness list features`.
- Integration fixtures, runtime integration tests, and GitHub Actions CI.

### Changed
- Unified task resolution across `run`, `verify`, and `list commands`.
- Wired hooks and audit logging into the main CLI lifecycle for `setup`, `update`, `doctor`, `verify`, and `scaffold`.
- Tightened project configuration detection semantics so project commands depend on project-level harness configuration.
- Improved cross-platform path handling in context collection and setup logic.

### Notes
- Publish target should use the `cc-agent-harness` package name because `agent-harness` is already taken in the npm registry.
