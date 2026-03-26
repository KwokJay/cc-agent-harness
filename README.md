<p align="center"><code>npm install -g cc-agent-harness</code></p>
<p align="center"><strong>cc-agent-harness</strong> — Harness scaffold for AI-assisted development. Initialize project harness based on project type + AI coding tool.</p>
<p align="center"><a href="./README.md">English</a> | <a href="./README.zh-CN.md">简体中文</a></p>

---

## What It Does

`cc-agent-harness` generates a complete AI development harness for your project in one command. It detects your project type, asks which AI coding tools you use, then generates all the right rule files, skills, constraints, and configuration — placed exactly where each tool expects them.

**Supported project types**: frontend, backend, fullstack, monorepo, docs (12+ languages auto-detected)

**Supported AI tools**: Cursor, Claude Code, GitHub Copilot, OpenAI Codex, OpenCode

## Quickstart

```shell
npm install -g cc-agent-harness

cd your-project
agent-harness init
```

The interactive flow will:
1. Detect your project type and language
2. Show any workspace sub-projects found
3. Ask which AI coding tools you use
4. Ask about optional toolpacks
5. Generate harness files
6. Auto-extract project skills
7. Attempt AI-powered deep skill extraction

## What Gets Generated

For a backend project using Cursor + Claude Code:

```text
AGENTS.md                                    Cross-tool AI instructions
CLAUDE.md                                    Claude Code entry (imports AGENTS.md)
CHANGELOG.md                                 Auto-generated from git history
.cursor/rules/project.mdc                    Cursor project rules
.cursor/rules/coding.mdc                     Cursor coding conventions
.cursor/rules/skill-*.mdc                    Cursor skill rules
.claude/skills/{name}/SKILL.md               Claude Code native skills
.claude/commands/verify.md                    Claude Code verify command
.harness/config.yaml                         Harness configuration
.harness/skills/                             Skill source (backup)
.harness/skills/skill-creator/SKILL.md       Skill creation methodology
.harness/skills/EXTRACTION-TASK.md           AI-powered extraction task
.harness/skills/PROJECT-ANALYSIS.md          Static analysis results
.harness/skills/INDEX.md                     Skill index
.harness/workflows/ralph-loop.md             Ralph-style verify loop (docs)
.harness/workflows/multi-agent-patterns.md   Multi-agent role patterns (docs)
.harness/recommended-tools.md                Static tool / paste-target reference
.harness/state/harness-version.txt           Harness CLI version at last refresh
```

## Skill Distribution

Skills are stored in `.harness/skills/` as the canonical source, then distributed to each tool's native path:

| Tool | Native skill path |
|------|------------------|
| Cursor | `.cursor/rules/skill-{name}.mdc` |
| Claude Code | `.claude/skills/{name}/SKILL.md` |
| Copilot | `.github/instructions/{name}.instructions.md` |
| Codex | `.agents/skills/{name}/SKILL.md` |
| OpenCode | `.opencode/skills/{name}/SKILL.md` |

## Two-Step Skill Extraction

**Step 1 (static)**: The scaffold scans your project files and generates baseline skills from dependencies, directory structure, config files, and test patterns.

**Step 2 (AI-powered)**: Invokes your AI tool (by priority: Claude Code > Codex > Cursor > Copilot > OpenCode) to perform deep extraction using the `skill-creator` methodology.

## Built-in Constraints

The harness injects governance rules into AGENTS.md and each tool's rule files:

- **Documentation Rules**: All docs must go under `.harness/docs/{feature-name}/`
- **Changelog Rules**: `CHANGELOG.md` must be updated after every meaningful change

## Commands

```shell
agent-harness init                     # Interactive initialization
agent-harness init -p backend -t cursor,claude-code  # Non-interactive
agent-harness doctor                   # Check harness health
agent-harness doctor --json            # Machine-readable output
agent-harness doctor --verify          # Doctor, then run workflows.verification.checks
agent-harness verify                   # Run verification commands from config
agent-harness update                   # Refresh generated files
agent-harness update --dry-run         # Preview; lists paths removed from plan vs generated_files
agent-harness list tools               # List supported AI tools
agent-harness list projects            # List supported project types
agent-harness list toolpacks           # Optional toolpacks (id, source, version)
agent-harness mcp merge [name]         # Merge one server into .cursor/mcp.json (--file, --dry-run)
```

## MCP config paths (reference)

| Tool / product | Typical MCP / extension config location |
|----------------|----------------------------------------|
| Cursor | `.cursor/mcp.json` (`mcpServers`) |
| Claude Code | See [Anthropic Claude Code docs](https://docs.anthropic.com/en/docs/claude-code) for MCP / plugins |
| OpenAI Codex | Codex MCP / config per [OpenAI developer docs](https://developers.openai.com/codex) |
| OpenCode | `opencode.json` and vendor docs |
| GitHub Copilot | VS Code / Copilot extension settings |

To merge a server into **Cursor** without editing JSON by hand:

```shell
echo '{"command":"npx","args":["-y","some-mcp-package"]}' | agent-harness mcp merge my-server
agent-harness mcp merge --dry-run my-server --file ./server.json
```

Optional JSON Schema for Cursor’s shape ships with the package: `schemas/cursor-mcp.json` (point your editor schema mapping at it if useful).

## Verify state (local)

After `agent-harness verify`, a summary is written to `.harness/state/last-verify.json` (no secrets). `agent-harness doctor` warns if it is missing, failed, or older than 7 days. Commit or gitignore this directory per team preference. `harness-version.txt` records the CLI version used at last scaffold refresh.

## Optional Toolpacks

Built-in and local (`.harness/toolpacks/`) packs are always listed. **npm toolpacks** are discovered when their package name matches `@agent-harness/toolpack-*` or `agent-harness-toolpack-*` and defines `agent-harness.toolpack` in `package.json`. See [docs/TOOLPACK-AUTHOR.md](./docs/TOOLPACK-AUTHOR.md).

| Pack | Category | Description |
|------|----------|-------------|
| context-mode | Context Engineering | MCP context sandbox with session continuity |
| rtk | Context Engineering | Terminal output compression (60-90% token savings) |
| understand-anything | Analysis | Codebase knowledge graph and architecture dashboard |
| gstack | Engineering Support | Virtual engineering team skills for Claude Code |

```shell
agent-harness init --toolpacks context-mode,rtk
```

## Package and CLI

- npm package: `cc-agent-harness`
- CLI command: `agent-harness`

## Development

Before finishing a change, run `pnpm agent-review` (lint + test with coverage + build + E2E). See [CONTRIBUTING.md](./CONTRIBUTING.md).

### Roadmap

- [Phase 2](./PHASE2_PLAN.md) — skill merge in generator, `verify` CLI, E2E & coverage  
- [Phase 3](./PHASE3_PLAN.md) — MCP/toolpack ecosystem, light state, Ralph & multi-agent artifacts  
- [Phase 4](./PHASE4_PLAN.md) — manifest, `diagnose`, migration, v1.0 productization

## License

Licensed under the [MIT License](./LICENSE).
