# Getting Started

This guide walks through the first successful setup of `cc-agent-harness`, from installation to configuration, health checks, and verification.

## Prerequisites

- `Node >=22`
- `npm` for global installation, or `pnpm` for local development in this repository
- A project directory where you want to standardize AI-assisted workflows

## Install

### Global install

If you want to use the CLI across projects:

```shell
npm install -g cc-agent-harness
```

Then verify the bundled `agent-harness` command is available:

```shell
agent-harness --help
```

### Local development

If you are working on `cc-agent-harness` itself:

```shell
pnpm install
pnpm build
pnpm test
pnpm lint
```

## Initialize a project

Run `setup` at the root of the target project:

```shell
agent-harness setup
```

Useful options:

```shell
agent-harness setup --language typescript
agent-harness setup --template minimal
agent-harness setup --template full
```

`setup` will:

- create `.harness/` if it does not exist
- create `.harness/skills/`
- generate `.harness/harness.config.yaml`
- generate `AGENTS.md` if it does not already exist

If `AGENTS.md` already exists, `setup` leaves it in place and suggests using `agent-harness update` when you want to refresh generated content.

## Generated files

After a fresh setup, you should typically have:

```text
.harness/
  harness.config.yaml
  skills/
AGENTS.md
```

### `harness.config.yaml`

This is the main project configuration. A minimal example looks like this:

```yaml
project:
  name: my-project
  language: typescript
  description: ""

agents:
  delegation_first: true
  model_routing:
    low: low
    medium: medium
    high: high

skills:
  directories:
    - ".harness/skills"
  auto_detect: true

workflows:
  verification:
    checks: ["build", "test", "lint"]

templates:
  agents_md:
    variant: standard
```

### `AGENTS.md`

This file is generated from a template variant:

- `minimal`
- `standard`
- `full`

Use it to define project-specific instructions, workflow expectations, and agent behavior conventions.

## Config layers

`cc-agent-harness` supports layered configuration, from lowest to highest priority:

1. Built-in defaults
2. `~/.harness/config.yaml`
3. `.harness/harness.config.yaml`
4. Extra programmatic overrides if you use the library API

This makes it easy to keep shared personal defaults while still customizing each repository.

## Run health checks

Use `doctor` after setup:

```shell
agent-harness doctor
```

For CI or editor integrations, you can also request machine-readable output:

```shell
agent-harness doctor --json
```

`doctor` checks the current project for things like:

- whether `.harness/harness.config.yaml` exists and is valid
- whether `AGENTS.md` exists
- tool availability
- skill directory status
- adapter-specific project checks when the project type is detected
- configured agent definition counts

If any required check fails, the command exits with a non-zero status.

## Run verification

Use `verify` to execute your project's verification pipeline:

```shell
agent-harness verify
```

By default, verification runs the checks listed in:

```yaml
workflows:
  verification:
    checks: ["build", "test", "lint"]
```

Commands are resolved from:

1. built-in adapter commands for the detected project type
2. explicit `workflows.commands` entries in your config

If you want to stop on the first failure:

```shell
agent-harness verify --fail-fast
```

For automation, you can also emit machine-readable verification results:

```shell
agent-harness verify --json
```

## Run a named task

Use `run` when you want to execute one specific configured task:

```shell
agent-harness run build
agent-harness run test
agent-harness run lint
```

You can also add your own custom tasks:

```yaml
workflows:
  commands:
    typecheck: "tsc --noEmit"
    coverage: "vitest run --coverage"
```

Then run them with:

```shell
agent-harness run typecheck
agent-harness run coverage
```

## List project resources

The `list` command helps inspect what `agent-harness` sees in the current project:

```shell
agent-harness list skills
agent-harness list agents
agent-harness list commands
agent-harness list templates
```

Use this when debugging configuration, checking discovered skills, or verifying custom commands.

To inspect configured feature states:

```shell
agent-harness list features
```

## Build reusable context

Use `context build` when you want to turn project instructions and local skills into a stable context artifact:

```shell
agent-harness context build
agent-harness context build --format xml
agent-harness context build --output .harness/context.md
```

The generated context can include:

- hierarchical `AGENTS.md` files from the project tree
- configured custom rules
- discovered local skills

This is useful for IDE agents, external runners, and scripted workflows that need reproducible context input.

## Work with skills

Create a new skill scaffold:

```shell
agent-harness scaffold skill my-skill -d "Description of the skill"
```

By default, skills are discovered from `.harness/skills`, but you can configure additional directories:

```yaml
skills:
  directories:
    - ".harness/skills"
    - "vendor/skills"
```

A valid skill should contain a `SKILL.md` file with YAML frontmatter.

## Inspect and validate config

Show the merged configuration:

```shell
agent-harness config show
```

Validate your config files:

```shell
agent-harness config validate
```

Generate JSON Schema for editor tooling or validation workflows:

```shell
agent-harness schema generate
```

Or write it to a custom location:

```shell
agent-harness schema generate --output ./schemas/harness.schema.json
```

## Update generated files

Use `update` when you want to refresh templates or configuration:

```shell
agent-harness update
```

Preview changes without writing files:

```shell
agent-harness update --check
```

Refresh only a specific template family:

```shell
agent-harness update --template agents-md
```

## Built-in adapters

`cc-agent-harness` includes built-in adapters for common project types:

| Adapter | Detection | Typical commands |
|---------|-----------|------------------|
| TypeScript | `tsconfig.json` or `package.json` | `build`, `test`, `lint` |
| Python | `pyproject.toml`, `setup.py`, or `requirements.txt` | `test`, `lint`, `fmt` |
| Rust | `Cargo.toml` | `fmt`, `test`, `clippy`, `build` |

If an adapter is detected, its commands can be used by `verify` and `run` automatically.

## Programmatic usage

You can also use `cc-agent-harness` as a library:

```typescript
import {
  loadConfig,
  AgentRegistry,
  discoverSkills,
  routeModel,
  inferComplexity,
  render,
} from "cc-agent-harness";

const config = await loadConfig();
const registry = new AgentRegistry(config.agents.definitions);
const executor = registry.get("executor");
const tier = routeModel(
  inferComplexity("refactor the auth module"),
  config.agents.model_routing,
);
const skills = await discoverSkills(config.skills.directories);
const output = render("Hello {{name}}", { name: "World" });
```

## Recommended first workflow

For a new repository, the simplest path is:

1. Install `cc-agent-harness`
2. Run `agent-harness setup`
3. Review `.harness/harness.config.yaml`
4. Review or customize `AGENTS.md`
5. Run `agent-harness doctor`
6. Run `agent-harness verify`
7. Add local skills under `.harness/skills`
8. Add custom workflow commands if the defaults are not enough

## Troubleshooting

### `No harness configuration found`

Run:

```shell
agent-harness setup
```

### `harness.config.yaml invalid`

Run:

```shell
agent-harness config validate
```

Then compare your file against the schema and examples in [`config-reference.md`](./config-reference.md).

### `No skills directories found`

Create `.harness/skills/` manually or rerun:

```shell
agent-harness setup
```

### Verification task is missing

Check:

- whether an adapter was detected for the project
- whether `workflows.commands` defines the task
- the output of `agent-harness list commands`

## Next docs

- [`../CHANGELOG.md`](../CHANGELOG.md)
- [`architecture.md`](./architecture.md)
- [`config-reference.md`](./config-reference.md)
- [`adapter-guide.md`](./adapter-guide.md)
- [`plugin-guide.md`](./plugin-guide.md)
