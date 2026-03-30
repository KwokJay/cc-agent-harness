# Harness manifest (`.harness/manifest.json`)

The manifest is a **machine-readable snapshot** of the harness for the current repo. It is regenerated when you run `harn init`, `harn update` (non dry-run), or explicitly:

```shell
harn manifest
harn manifest --json   # also print JSON to stdout
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
| `toolpacks` | Selected optional toolpacks: `packSource`, `packVersion`, optional `provenance` (`official` \| `community`), optional `verificationHint`, optional `sharedPolicy` (Phase 6) |
| `aggregation` | Optional `org` / `repo_slug` from config for **cross-repo correlation** without scraping (Phase 6 / ORG-02) |
| `approved_exceptions` | Optional list from config: approved policy exceptions (`id`, optional `description`, `target`) for aggregation (Phase 6 / ORG-03) |
| `skills` | `count` and `ids` discovered under `.harness/skills/*/SKILL.md` |
| `verification` | Each `workflows.verification.checks` entry with resolved shell command |
| `generatedFilesCount` | Length of `generated_files` in config (if present) |
| `adoption` | Counts: tools, toolpacks, official toolpacks, skills discovered, verification checks configured (Phase 5 / ROI-02) |
| `health` | Last verify snapshot (if `.harness/state/last-verify.json` exists), days since verify, and **artifact coverage** for `generated_files` paths (present on disk ÷ tracked) |

### Cross-repo aggregation (Phase 6)

External jobs can **collect** `.harness/manifest.json` from many clones (or CI artifacts) and join on `aggregation.org` + `aggregation.repo_slug` plus toolpack ids / versions. **Approved exceptions** surface deliberate drift or carve-outs so dashboards do not treat them as unknown noise. See [SHARED-POLICY-PACKS.md](./SHARED-POLICY-PACKS.md) for shared policy packs vs repo-local packs.

## Relationship to `doctor` and `diagnose`

| Command | Role |
|---------|------|
| `harn doctor` | **Daily** health: files exist, config valid, skill distribution hints, last verify state |
| `harn diagnose` | **Deep** checks: verification wiring, `.cursor/mcp.json` JSON validity, writable dirs, **scaffold drift** (canonical output vs disk), optional `--run-verify` |
| `manifest` / `export` | **Inventory** for CI and external tools (no judgment beyond what config + scan provide) |

### Governance loop

Typical flow after the first `harn init`:

1. **`harn update`** — refresh generated files when config or harness version changes.  
2. **`harn verify`** — run `workflows.verification.checks` and confirm the repo still passes your gates.  
3. **`harn diagnose --json`** — deep health + drift; suitable for CI.  
4. **`harn manifest`** / **`harn export`** — refresh inventory for tooling and audits.

Drift means a generated path’s content (or presence) no longer matches what the harness would produce for the current `.harness/config.yaml` (see `detectDrift` / `drift.*` issues in JSON output).

### CI gating with `diagnose`

Fail the job when any error-level issue exists (including missing scaffold files):

```shell
harn diagnose --json > diagnose.json
# jq example: require zero errors
test "$(jq -r '.summary.error' < diagnose.json)" -eq 0
```

## Export (same data, human or file)

```shell
harn export
harn export --format json --out harness-export.json
```

Markdown and JSON exports are derived from the same builder as the manifest.

## CI example

See [ci-manifest-example.yml](./ci-manifest-example.yml) for a sample GitHub Actions job that asserts `manifestVersion` after `harn manifest`.
