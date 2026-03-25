# agent-harness

Universal development pipeline harness — configuration, templates, skill management, and health checks for AI-assisted projects.

## What is it?

`agent-harness` provides a vendor-neutral foundation for AI agent-assisted development workflows:

- **Configuration management** — layered YAML config with Zod validation
- **Agent registry** — define and route agents by domain and capability tier
- **Skill management** — discover, validate, and scaffold reusable skills
- **Health checks** — verify project setup, tools, and configuration
- **Template engine** — generate `AGENTS.md` and project files from templates
- **Verification pipeline** — run build/test/lint checks from config
- **Project adapters** — language-specific commands and checks for TypeScript, Python, Rust

## Quick Start

```bash
# Install
npm install -g agent-harness

# Initialize in your project
agent-harness setup

# Check project health
agent-harness doctor

# Run verification checks
agent-harness verify
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `agent-harness setup` | Initialize `.harness/` directory and `AGENTS.md` |
| `agent-harness update` | Sync templates and configuration |
| `agent-harness doctor` | Run health checks on the project |
| `agent-harness verify` | Execute verification checks (build, test, lint) |
| `agent-harness list <resource>` | List skills, agents, commands, or templates |
| `agent-harness scaffold skill <name>` | Create a new skill from template |
| `agent-harness config show` | Display merged configuration |
| `agent-harness config validate` | Validate configuration files |

## Configuration

Configuration lives in `.harness/harness.config.yaml` with optional user-level overrides at `~/.harness/config.yaml`.

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
    high: "claude-opus-4-20250514"
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

Agent tiers use generic levels (`low`, `medium`, `high`) instead of vendor-specific model names. Map tiers to actual models via the `providers` field:

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

// Load and validate config
const config = await loadConfig();

// Query agents
const registry = new AgentRegistry(config.agents.definitions);
const agent = registry.get("executor");
const executors = registry.listByDomain("execution");

// Route model tier based on task
const complexity = inferComplexity("refactor the auth module");
const tier = routeModel(complexity, config.agents.model_routing);

// Discover skills
const skills = await discoverSkills(config.skills.directories);

// Render templates
const output = render("Hello {{name}}", { name: "World" });
```

## Project Adapters

Built-in adapters detect project type and provide language-specific commands and health checks:

| Adapter | Detection | Commands |
|---------|-----------|----------|
| TypeScript | `tsconfig.json` or `package.json` | build, test, lint |
| Python | `pyproject.toml`, `setup.py`, or `requirements.txt` | test, lint, fmt |
| Rust | `Cargo.toml` | fmt, test, clippy, build |

## Skills

Skills are directories containing a `SKILL.md` with YAML frontmatter:

```markdown
---
name: my-skill
description: What this skill does
---

# My Skill

Usage instructions here.
```

Scaffold a new skill:

```bash
agent-harness scaffold skill my-skill -d "Description of the skill"
```

## Architecture

```
.harness/
  harness.config.yaml    # Project configuration
  skills/                # Local skills directory
AGENTS.md                # Generated agent instructions
```

The framework is structured as:

```
src/
  config/     — Schema, defaults, config loading
  agent/      — Registry, model routing
  adapter/    — Project type detection, language adapters
  skill/      — Discovery, validation, scaffolding
  health/     — Health check framework and built-in checks
  template/   — Template engine and file renderer
  cli/        — CLI command implementations
```

## License

MIT
