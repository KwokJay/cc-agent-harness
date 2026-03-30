# ROI evidence and reproducible proof

This document ties **product value** to **commands and outputs** you can re-run locally or in CI. It aligns with [ROI-BASELINE.md](../.planning/phases/01-icp-and-golden-paths/ROI-BASELINE.md) indicators **M2** (golden-path coverage) and **M3** (declared artifact coverage via manifest).

**Related:** [GOLDEN-PATHS.md](./GOLDEN-PATHS.md) (three copy-paste `harn init` flows), [MANIFEST.md](./MANIFEST.md) (schema).

## Before / after framing

| Dimension | Before | After (with harness) |
|-----------|--------|----------------------|
| Cross-tool rules/skills | Hand-copied per repo/tool | One `harn init` + `harn update` keeps canonical outputs |
| Audit / CI | Ad-hoc scripts | `harn verify`, `harn diagnose --json`, `.harness/manifest.json` with **adoption** + **health** |
| Declared vs disk (M3) | Informal checklists | `manifest.health.artifactCoverageRatio` for paths in `generated_files` |

## 1 — Manifest: adoption and health

After any successful `harn init`, the repo has `.harness/config.yaml`. Refresh the manifest:

```shell
harn manifest --json
```

Inspect machine-readable counts and health:

```shell
harn manifest --json | jq '.adoption, .health'
```

- **adoption** — `toolsEnabled`, `toolpacksEnabled`, `officialToolpacksEnabled`, `skillsDiscovered`, `verificationChecksConfigured`.
- **health** — `lastVerifyAt` / `lastVerifyOk` if `.harness/state/last-verify.json` exists (run `harn verify` first), `daysSinceLastVerify`, and **artifact coverage** for `generated_files`: `generatedFilesTracked`, `generatedFilesPresentOnDisk`, `artifactCoverageRatio` (0–1).

**M3:** Compare `artifactCoverageRatio` before and after `harn update` or a drift fix; cite `harnessCliVersion` and `generatedAt` for dated evidence.

## 2 — Export (same fields)

```shell
harn export --format md --out harness-export.md
harn export --format json --out harness-export.json
```

Markdown includes **Adoption** and **Health** sections; JSON matches the manifest shape.

## 3 — Golden paths (M2)

Exact commands and expected artifacts: [GOLDEN-PATHS.md](./GOLDEN-PATHS.md).

Automated proof (**ROI-01**): all **three** documented golden paths have a corresponding passing test in `tests/e2e/cli-smoke.test.ts` (see per-section **E2E coverage** lines in [GOLDEN-PATHS.md](./GOLDEN-PATHS.md)). Run:

```shell
pnpm test:e2e
```

Expected: full suite green (three init presets; the first test also exercises `doctor`, `update --dry-run`, `verify`, `manifest`, `export`, `diagnose`, `migrate` after backend init).

## 4 — CI-friendly one-liners

```shell
# Verify manifest contains ROI fields (after init in repo)
test "$(harn manifest --json | jq -r '.adoption | type')" = "object"
test "$(harn manifest --json | jq -r '.health.artifactCoverageRatio <= 1')" = "true"
```

Adjust paths if `harn` is invoked via `node dist/harness.js`.
