<p align="center"><code>npm install -g agent-harness</code></p>
<p align="center"><strong>agent-harness</strong> is a vendor-neutral CLI and TypeScript toolkit for AI-assisted development workflows.</p>
<p align="center"><a href="./README.md">English</a> | <a href="./README.zh-CN.md">简体中文</a></p>

It helps teams standardize project setup, `AGENTS.md` generation, skill discovery, health checks, and verification pipelines without locking into a single model vendor or agent framework.

---

## Quickstart

### Install and run

Install globally with npm:

```shell
npm install -g agent-harness
```

Then initialize a project:

```shell
agent-harness setup
agent-harness doctor
agent-harness verify
```

### Develop from source

This repository targets `Node >=22` and uses `pnpm` for local development.

```shell
pnpm install
pnpm build
pnpm test
pnpm lint
```

## What It Does

- Generates a consistent `.harness/` project scaffold and `AGENTS.md` from templates.
- Loads layered YAML configuration and validates it with Zod.
- Routes agent/model tiers through vendor-neutral `low` / `medium` / `high` mappings.
- Discovers, validates, and scaffolds reusable project skills.
- Detects project type and resolves verification commands for TypeScript, Python, and Rust.
- Runs project health checks plus configurable verification pipelines like build, test, and lint.
- Exposes the same primitives as a TypeScript library for deeper integration.

## Common Commands

| Command | Description |
|---------|-------------|
| `agent-harness setup` | Initialize `.harness/` and generate `AGENTS.md` |
| `agent-harness update` | Sync templates and configuration |
| `agent-harness doctor` | Run health checks for the current project |
| `agent-harness verify` | Execute the configured verification pipeline |
| `agent-harness run <task>` | Run a named workflow or adapter command |
| `agent-harness list <resource>` | List `skills`, `agents`, `commands`, or `templates` |
| `agent-harness config show` | Print merged configuration |
| `agent-harness config validate` | Validate config files |
| `agent-harness schema generate` | Generate JSON Schema for the config |
| `agent-harness scaffold skill <name>` | Create a new skill scaffold |

## Configuration

Project config lives at `.harness/harness.config.yaml`. Optional user-level defaults can live at `~/.harness/config.yaml`.

```yaml
project:
  name: my-project
  language: typescript
  description: "My AI-assisted project"

agents:
  delegation_first: true
  model_routing:
    low: low
    medium: medium
    high: high
  providers:
    low: "gpt-4o-mini"
    medium: "claude-sonnet-4-20250514"
    high: "o3"
  definitions: []

skills:
  directories:
    - ".harness/skills"
  auto_detect: true

workflows:
  commands:
    build: "npm run build"
    test: "npm test"
    lint: "npm run lint"
  verification:
    checks: ["build", "test", "lint"]

templates:
  agents_md:
    variant: standard
    custom_rules: []
```

### Model Tiers

`agent-harness` keeps model routing vendor-neutral. Agents and workflows use `low`, `medium`, and `high`, while `providers` maps those tiers to concrete model IDs.

```yaml
agents:
  providers:
    low: "gpt-4o-mini"
    medium: "claude-sonnet-4-20250514"
    high: "o3"
```

## Programmatic API

```typescript
import {
  loadConfig,
  AgentRegistry,
  discoverSkills,
  routeModel,
  inferComplexity,
  runHealthChecks,
  render,
} from "agent-harness";

const config = await loadConfig();
const registry = new AgentRegistry(config.agents.definitions);
const agent = registry.get("executor");
const tier = routeModel(
  inferComplexity("refactor the auth module"),
  config.agents.model_routing,
);
const skills = await discoverSkills(config.skills.directories);
const report = await runHealthChecks([]);
const output = render("Hello {{name}}", { name: "World" });
```

## Built-in Adapters

Built-in adapters detect the current project and provide default commands and checks.

| Adapter | Detection | Typical commands |
|---------|-----------|------------------|
| TypeScript | `tsconfig.json` or `package.json` | `build`, `test`, `lint` |
| Python | `pyproject.toml`, `setup.py`, or `requirements.txt` | `test`, `lint`, `fmt` |
| Rust | `Cargo.toml` | `fmt`, `test`, `clippy`, `build` |

## Skills

Skills are directories containing a `SKILL.md` file with YAML frontmatter.

```markdown
---
name: my-skill
description: What this skill does
---

# My Skill

Usage instructions here.
```

Create one with:

```shell
agent-harness scaffold skill my-skill -d "Description of the skill"
```

## Architecture

Generated project structure:

```text
.harness/
  harness.config.yaml
  skills/
AGENTS.md
```

Core source layout:

```text
src/
  config/        Schema, defaults, layered config loading
  agent/         Agent registry and model tier routing
  adapter/       Project type detection and language adapters
  skill/         Skill discovery, validation, scaffolding
  health/        Health checks and reporting
  template/      Template rendering and file generation
  hook/          Lifecycle hook discovery and dispatch
  feature/       Feature registry
  plugin/        Plugin interface and registry
  context/       Context assembly pipeline
  audit/         Append-only audit logging
  cli/           Command implementations
```

## Docs

- [`docs/getting-started.md`](./docs/getting-started.md)
- [`docs/architecture.md`](./docs/architecture.md)
- [`docs/config-reference.md`](./docs/config-reference.md)
- [`docs/adapter-guide.md`](./docs/adapter-guide.md)
- [`docs/plugin-guide.md`](./docs/plugin-guide.md)

## License

MIT
