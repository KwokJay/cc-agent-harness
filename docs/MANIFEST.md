# Harness manifest (`.harness/manifest.json`)

The manifest is a **machine-readable snapshot** of the harness for the current repo. It is regenerated when you run `agent-harness init`, `agent-harness update` (non dry-run), or explicitly:

```shell
agent-harness manifest
agent-harness manifest --json   # also print JSON to stdout
```

## Schema version

- Field `manifestVersion` starts at `1`. New fields are added in a backward-compatible way within the same major version.
- JSON Schema for tooling: [schemas/harness-manifest.json](../schemas/harness-manifest.json).

## Fields (summary)

| Field | Meaning |
|-------|---------|
| `manifestVersion` | Integer schema version for consumers |
| `generatedAt` | ISO 8601 timestamp |
| `harnessCliVersion` | `cc-agent-harness` CLI version used to build the manifest |
| `project` | `name`, `type`, `language`, optional `framework` from `.harness/config.yaml` |
| `tools` | Enabled AI tool ids |
| `toolpacks` | Selected optional toolpacks with `packSource` / `packVersion` |
| `skills` | `count` and `ids` discovered under `.harness/skills/*/SKILL.md` |
| `verification` | Each `workflows.verification.checks` entry with resolved shell command |
| `generatedFilesCount` | Length of `generated_files` in config (if present) |

## Relationship to `doctor` and `diagnose`

| Command | Role |
|---------|------|
| `agent-harness doctor` | **Daily** health: files exist, config valid, skill distribution hints, last verify state |
| `agent-harness diagnose` | **Deep** checks: verification wiring, `.cursor/mcp.json` JSON validity, writable dirs, optional `--run-verify` |
| `manifest` / `export` | **Inventory** for CI and external tools (no judgment beyond what config + scan provide) |

## Export (same data, human or file)

```shell
agent-harness export
agent-harness export --format json --out harness-export.json
```

Markdown and JSON exports are derived from the same builder as the manifest.

## CI example

See [ci-manifest-example.yml](./ci-manifest-example.yml) for a sample GitHub Actions job that asserts `manifestVersion` after `agent-harness manifest`.
