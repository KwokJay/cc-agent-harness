# Configuration Reference

## File Locations

| File | Purpose |
|------|---------|
| `~/.harness/config.yaml` | User-level defaults (shared across projects) |
| `.harness/harness.config.yaml` | Project-level configuration |

## Schema

### `project` (required)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | string | *required* | Project name |
| `language` | `"rust" \| "typescript" \| "python" \| "multi"` | `"typescript"` | Primary language |
| `description` | string | `""` | Project description |

### `agents`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `delegation_first` | boolean | `true` | Prefer delegating to specialists |
| `model_routing.low` | `"low" \| "medium" \| "high"` | `"low"` | Tier for simple tasks |
| `model_routing.medium` | `"low" \| "medium" \| "high"` | `"medium"` | Tier for standard tasks |
| `model_routing.high` | `"low" \| "medium" \| "high"` | `"high"` | Tier for complex tasks |
| `providers` | `Record<string, string>` | `{}` | Map tier names to model identifiers |
| `definitions` | `AgentDefinition[]` | `[]` | Custom agent definitions |

### `skills`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `directories` | `string[]` | `[".harness/skills"]` | Skill discovery directories |
| `auto_detect` | boolean | `true` | Auto-discover skills |

### `workflows`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `commands` | `Record<string, string>` | `{}` | Named shell commands |
| `verification.checks` | `string[]` | `["build", "test", "lint"]` | Verification check names |

### `templates`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `agents_md.variant` | `"minimal" \| "standard" \| "full"` | `"standard"` | AGENTS.md template variant |
| `agents_md.custom_rules` | `string[]` | `[]` | Custom rules to inject |

### `features`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `<key>` | boolean | — | Enable/disable feature flags |

## Example

```yaml
project:
  name: my-app
  language: typescript
  description: "My AI-assisted application"

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

skills:
  directories:
    - ".harness/skills"
    - "vendor/skills"

workflows:
  commands:
    build: "npm run build"
    test: "npm test"
    lint: "npm run lint"
    typecheck: "npx tsc --noEmit"
  verification:
    checks: ["build", "test", "lint", "typecheck"]

templates:
  agents_md:
    variant: full
    custom_rules:
      - "Always use TypeScript strict mode"

features:
  experimental_hooks: true
```
