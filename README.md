<p align="center"><code>npm install -g cc-agent-harness</code></p>
<p align="center"><strong>cc-agent-harness</strong> — Repo-local harness for AI-assisted development: one CLI scaffolds rules, skills, and governance artifacts across the AI tools your team actually uses.</p>
<p align="center"><a href="./README.md">English</a> | <a href="./README.zh-CN.md">简体中文</a></p>

---

**CLI name (v0.7.0+):** the command is `harn`. Install with `npm install -g cc-agent-harness` (package name unchanged). Older docs may still say `agent-harness`.

## Who this is for

**Product story (POS-02):** value is framed around **three ICPs**, **golden-path proof**, and **capability tiers** — not a flat feature list. Details: **[docs/POSITIONING.md](./docs/POSITIONING.md)**; flows: **[docs/GOLDEN-PATHS.md](./docs/GOLDEN-PATHS.md)**.

- **Multi-repo leads** standardizing Cursor / Claude Code / Codex (and more) across services  
- **Standards champions** who need `verify`, `manifest`, and `export` for audits  
- **OSS maintainers** giving contributors a consistent baseline (`AGENTS.md`, per-tool rules)

**Not a fit:** hosted-only governance, or single-tool teams with no sync problem. See **[docs/POSITIONING.md](./docs/POSITIONING.md)** (ICP detail).

**Capability tiers:** **[docs/CAPABILITY-MATRIX.md](./docs/CAPABILITY-MATRIX.md)** — *First-class* (Cursor, Claude Code, Codex) vs *baseline* (Copilot, OpenCode, Windsurf, Trae, Augment).

**Copy-paste flows:** **[docs/GOLDEN-PATHS.md](./docs/GOLDEN-PATHS.md)** — backend, frontend, and monorepo examples.

**Reproducible ROI proof:** **[docs/ROI.md](./docs/ROI.md)** — manifest adoption/health metrics, `jq` examples, and links to `ROI-BASELINE.md`.

## What It Does

`cc-agent-harness` generates a complete AI development harness for your project in one command. It detects your project type, asks which AI coding tools you use, then generates all the right rule files, skills, constraints, and configuration — placed exactly where each tool expects them.

**Supported project types**: frontend, backend, fullstack, monorepo, docs (12+ languages auto-detected)

**Supported AI tools** (tiered): **First-class** — Cursor, Claude Code, OpenAI Codex. **Baseline** — GitHub Copilot, OpenCode, Windsurf, Trae, Augment. See the matrix above for generation / diagnose / MCP / extraction boundaries.

**Runtime:** Node.js **>= 22** (`package.json` `engines`). Use `harn -V` / `harn --version` after install to confirm the CLI.

## Quickstart

```shell
npm install -g cc-agent-harness

cd your-project
harn init
```

Guided flows and expected files: **[docs/GOLDEN-PATHS.md](./docs/GOLDEN-PATHS.md)**.

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

**Step 2 (automated extraction vs manual fallback)**:

- **Automated** (`extractionAuto` in [docs/CAPABILITY-MATRIX.md](./docs/CAPABILITY-MATRIX.md)): only **Claude Code** and **Codex** have a scripted CLI path. The harness tries them in priority order **Claude Code → Codex → Cursor → Copilot → OpenCode**, skipping tools without a CLI or with the CLI missing from `PATH`, with an explicit console reason for each skip.
- **Manual fallback** (always available): open `.harness/skills/EXTRACTION-TASK.md` in any configured AI tool. Tools outside the automation priority list (e.g. Windsurf, Trae, Augment) rely on this path for deep extraction.

## Built-in Constraints

The harness injects governance rules into AGENTS.md and each tool's rule files:

- **Documentation Rules**: All docs must go under `.harness/docs/{feature-name}/`
- **Changelog Rules**: `CHANGELOG.md` must be updated after every meaningful change

## Commands

```shell
harn init                     # Interactive initialization
harn init -p backend -t cursor,claude-code  # Non-interactive
harn init -n my-app -p backend -t cursor,claude-code  # Set display name (--name)
harn init ... --skip-skill-extraction       # Skip Step 2 AI extraction (CI / smoke tests)
harn init ... --skip-docs                   # Skip generating .harness/docs/ tree
harn init ... --overwrite                   # Overwrite existing generated harness files
harn doctor                   # Check harness health
harn doctor --json            # Machine-readable output
harn doctor --verify          # Doctor, then run workflows.verification.checks
harn diagnose                 # Deep diagnostics (MCP JSON, verification wiring, writable dirs)
harn diagnose --json          # Machine-readable diagnose report
harn diagnose --run-verify    # Diagnose, then run workflows.verification.checks
harn manifest                 # Regenerate .harness/manifest.json
harn manifest --json          # Write manifest and print JSON
harn export                   # Print harness summary (Markdown, same data as manifest)
harn export -f json -o out.json             # -f / --format: md (default) or json; -o / --out: file
harn migrate 0.5.0            # Show migration plan (dry-run)
harn migrate 0.5.0 --apply    # Apply registered patches (0.5.0 = first from-version with a real config patch: adds generated_files if missing)
harn verify                   # Run verification commands from config
harn update                   # Refresh generated files (default: incremental)
harn update --dry-run         # Preview; lists paths removed from plan vs generated_files
harn update --full            # Force full regeneration (vs incremental default)
harn update --overwrite       # Force overwrite all generated files
harn list tools               # List supported AI tools
harn list projects            # List supported project types
harn list toolpacks           # Optional toolpacks (id, source, version)
harn mcp merge [name]         # Merge one server into .cursor/mcp.json (--file, --dry-run)
harn -V                       # Print CLI version (same as: harn --version)
```

### CLI reference (all flags)

| Command | Options |
|--------|---------|
| **`harn init`** | `-p` / `--project` one of `frontend`, `backend`, `fullstack`, `monorepo`, `docs` · `-t` / `--tools` comma-separated tool ids (see below) · `-n` / `--name` project name · `--toolpacks` comma-separated ids · `--skip-docs` · `--skip-skill-extraction` · `--overwrite` |
| **`harn doctor`** | `--json` · `--verify` |
| **`harn diagnose`** | `--json` · `--run-verify` |
| **`harn manifest`** | `--json` |
| **`harn export`** | `-f` / `--format` `md` or `json` · `-o` / `--out` file |
| **`harn migrate`** | `<fromVersion>` · `--apply` |
| **`harn update`** | `--dry-run` · `--full` · `--overwrite` |
| **`harn mcp merge`** | optional server `name` · `-f` / `--file` path · `--dry-run` |

**`-t` / `--tools` ids** (non-interactive): `cursor`, `claude-code`, `copilot`, `codex`, `opencode`, `windsurf`, `trae`, `augment` — same as `harn list tools`. The built-in `--help` string may list a subset; this table is complete.

**Global:** `harn --help`, `harn -h`, `harn -V`, `harn --version`, and `harn <command> --help`.

### Regeneration and stable custom rules

`harn update` defaults to **incremental** refresh; `--full` forces a full regeneration pass, and `--overwrite` forces overwriting generated files. Re-runs can still replace whole files where the scaffold does not merge (e.g. manual edits in `AGENTS.md` may be lost). Put durable team rules in **`.harness/config.yaml`** under **`custom_rules`** (list of strings) so they are merged into generated cross-tool output. See **[docs/GOLDEN-PATHS.md](./docs/GOLDEN-PATHS.md)**.

### Governance loop

After setup, use **`harn update`** → **`harn verify`** → **`harn diagnose --json`** (and **`harn manifest`** / **`harn export`** for inventory) to keep generated rules and skills aligned with config and catch drift in CI. See **[docs/MANIFEST.md](./docs/MANIFEST.md)** for the full loop and a `diagnose` + `jq` gate example.

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
echo '{"command":"npx","args":["-y","some-mcp-package"]}' | harn mcp merge my-server
harn mcp merge --dry-run my-server --file ./server.json
```

Optional JSON Schema for Cursor’s shape ships with the package: `schemas/cursor-mcp.json` (point your editor schema mapping at it if useful).

Harness manifest schema: `schemas/harness-manifest.json`. See [docs/MANIFEST.md](./docs/MANIFEST.md) for field reference and CI ideas.

Optional toolpack listing for docs/marketing: [docs/toolpacks-index.md](./docs/toolpacks-index.md) (regenerate with `pnpm run generate:toolpack-index`).

## Verify state (local)

After `harn verify`, a summary is written to `.harness/state/last-verify.json` (no secrets). `harn doctor` warns if it is missing, failed, or older than 7 days. Commit or gitignore this directory per team preference. `.harness/state/harness-version.txt` records the CLI version used at last scaffold refresh.

## Optional Toolpacks

Built-in and local (`.harness/toolpacks/`) packs are always listed. **npm toolpacks** are discovered when their package name matches `@agent-harness/toolpack-*` or `agent-harness-toolpack-*` and defines `agent-harness.toolpack` in `package.json`. See [docs/TOOLPACK-AUTHOR.md](./docs/TOOLPACK-AUTHOR.md).

| Pack | Category | Description |
|------|----------|-------------|
| context-mode | Context Engineering | MCP context sandbox with session continuity |
| rtk | Context Engineering | Terminal output compression (60-90% token savings) |
| understand-anything | Analysis | Codebase knowledge graph and architecture dashboard |
| gstack | Engineering Support | Virtual engineering team skills for Claude Code |

```shell
harn init --toolpacks context-mode,rtk
```

## Package and CLI

- npm package: `cc-agent-harness`
- CLI command: `harn`
- Node.js: `>= 22`

## Development

- **Full gate (contributors):** `pnpm agent-review` — lint, coverage tests, build, E2E, toolpack index check. See [CONTRIBUTING.md](./CONTRIBUTING.md).
- **Faster loop:** `pnpm verify` — lint, unit tests, build, E2E, toolpack check (no coverage threshold).

## More documentation

- [CHANGELOG.md](./CHANGELOG.md) — release history  
- [SECURITY.md](./SECURITY.md) — security policy  
- [CONTRIBUTING.md](./CONTRIBUTING.md) — development and release

## License

Licensed under the [MIT License](./LICENSE).
