# Architecture

## Overview

agent-harness is a vendor-neutral toolkit for AI-assisted development workflows. It provides configuration management, agent orchestration metadata, skill management, health checks, and extensibility through plugins and hooks.

## Module Structure

```
src/
  config/        Schema, defaults, layered config loading
  agent/         Agent registry and model tier routing
  adapter/       Project type detection and language adapters
  skill/         Skill discovery, validation, scaffolding
  health/        Health check framework and built-in checks
  template/      Lightweight template engine and file renderer
  hook/          Lifecycle hook system (discovery + dispatch)
  feature/       Feature flag registry
  plugin/        Plugin interface and registry
  context/       Context assembly pipeline
  audit/         Append-only JSONL audit logger
  cli/           CLI command implementations
```

## Data Flow

```
                     +-----------------+
                     |  harness.config |
                     |    .yaml        |
                     +--------+--------+
                              |
                     +--------v--------+
                     | Config Loader   |
                     | (N-layer merge) |
                     +--------+--------+
                              |
            +-----------------+------------------+
            |                 |                  |
   +--------v------+  +------v-------+  +-------v-------+
   | AgentRegistry |  | SkillManager |  | AdapterRegistry|
   | (32 built-in  |  | (discover,   |  | (TS, Py, Rust  |
   |  + custom)    |  |  validate)   |  |  + custom)     |
   +--------+------+  +------+-------+  +-------+-------+
            |                 |                  |
            +-----------------+------------------+
                              |
                     +--------v--------+
                     | ContextPipeline |
                     | (assemble       |
                     |  agent context) |
                     +--------+--------+
                              |
                     +--------v--------+
                     |   AGENTS.md /   |
                     |  System Prompt  |
                     +-----------------+
```

## Extension Points

| Extension | Mechanism |
|-----------|-----------|
| Custom adapters | `AdapterRegistry.register()` or via plugin |
| Custom agents | `agents.definitions` in config or via plugin |
| Custom health checks | Via plugin `healthChecks` field |
| Lifecycle hooks | `.harness/hooks.yaml` with event + command |
| Feature flags | `features` in config + `FeatureRegistry` |
| Plugins | `PluginRegistry.register()` with combined capabilities |
| Config layers | `loadConfig({ extraLayers })` for programmatic overrides |
| Skill directories | `skills.directories` in config or via plugin |
| Template variants | `templates.agents_md.variant` supports custom paths |

## Config Layer Order

Lowest to highest priority:

1. Built-in defaults (Zod schema defaults)
2. User-level config (`~/.harness/config.yaml`)
3. Project-level config (`.harness/harness.config.yaml`)
4. Extra layers (programmatic overrides via API)

## Key Design Decisions

- **Vendor-neutral tiers**: Model tiers use `low/medium/high` instead of vendor-specific names. The `providers` mapping translates tiers to actual model identifiers.
- **Config-driven paths**: All skill directories, verification checks, and commands come from configuration, not hardcoded values.
- **Plugin composition**: Plugins can contribute adapters, agents, hooks, health checks, features, and skill directories through a single registration.
- **Append-only audit**: Operations are logged to `.harness/logs/audit.jsonl` for traceability.
- **Hook protocol**: Hooks receive structured JSON on stdin and are executed as external commands, keeping the core framework language-agnostic.
