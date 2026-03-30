# Golden paths

End-to-end flows for the three ICP-oriented scenarios. Commands use non-interactive `harn init`. For **automated smoke tests** (no vendor CLIs), append `--skip-skill-extraction` so Step 2 does not invoke `claude` / `codex` / etc.

**Value proof:** After running any path below, use **[ROI.md](./ROI.md)** to capture `harn manifest --json` adoption/health metrics and compare against [ROI-BASELINE.md](../.planning/phases/01-icp-and-golden-paths/ROI-BASELINE.md).

---

## 1 — Backend service (Cursor + Claude Code)

**Intended user:** Team shipping APIs/services; wants Cursor rules plus Claude Code skills/commands from one harness.

**Command:**

```shell
harn init -p backend -t cursor,claude-code -n my-service
```

**Value proof:** Shared `AGENTS.md` + Cursor `.mdc` rules + `.claude/skills` and `CLAUDE.md` without hand-copying per repo.

**Expected artifacts** (after scaffold; names may vary slightly by preset):

| Area | Paths |
|------|--------|
| Cross-tool | `AGENTS.md`, `CHANGELOG.md` |
| Cursor | `.cursor/rules/project.mdc`, `.cursor/rules/coding.mdc`, `.cursor/rules/skill-api-conventions.mdc` |
| Claude Code | `CLAUDE.md`, `.claude/commands/verify.md`, `.claude/skills/api-conventions/SKILL.md` |
| Harness | `.harness/config.yaml`, `.harness/manifest.json`, `.harness/skills/**`, `.harness/workflows/*.md` |

**E2E coverage:** `tests/e2e/cli-smoke.test.ts` → suite `CLI smoke (dist/harness.js)`, test **`init, doctor, update --dry-run, verify`** (uses the same `init` flags as this section).

---

## 2 — Frontend app (Cursor + Codex)

**Intended user:** UI team standardizing on Cursor + OpenAI Codex layout (`.codex`, `.agents/skills`).

**Command:**

```shell
harn init -p frontend -t cursor,codex -n my-app
```

**Value proof:** Codex-native config and skills under `.codex/` and `.agents/skills/` plus Cursor rules from the same harness run.

**Expected artifacts:**

| Area | Paths |
|------|--------|
| Cross-tool | `AGENTS.md`, `CHANGELOG.md` |
| Cursor | `.cursor/rules/project.mdc`, `.cursor/rules/coding.mdc`, `.cursor/rules/skill-frontend-conventions.mdc` |
| Codex | `.codex/config.toml`, `.agents/skills/frontend-conventions/SKILL.md` |
| Harness | `.harness/config.yaml`, `.harness/manifest.json`, `.harness/skills/**` |

**E2E coverage:** `tests/e2e/cli-smoke.test.ts` → **`golden path: frontend + cursor,codex (artifact set)`**.

---

## 3 — Monorepo / team standardization (Cursor + Claude Code + Codex)

**Intended user:** Platform or lead aligning multiple packages; **Cursor** + **Claude Code** + **Codex** in one repo.

**Command:**

```shell
harn init -p monorepo -t cursor,claude-code,codex -n my-workspace
```

**Value proof:** Monorepo discipline skills land in harness + Claude + Codex paths; Cursor gets matching rules. Workspace packages are surfaced in static analysis / `PROJECT-ANALYSIS.md` when present.

**Expected artifacts:**

| Area | Paths |
|------|--------|
| Cross-tool | `AGENTS.md`, `CHANGELOG.md` |
| Cursor | `.cursor/rules/project.mdc`, `.cursor/rules/coding.mdc`, `.cursor/rules/skill-monorepo-discipline.mdc` |
| Claude Code | `CLAUDE.md`, `.claude/commands/verify.md`, `.claude/skills/monorepo-discipline/SKILL.md` |
| Codex | `.codex/config.toml`, `.agents/skills/monorepo-discipline/SKILL.md` |
| Harness | `.harness/config.yaml`, `.harness/manifest.json`, `.harness/skills/**` |

**E2E coverage:** `tests/e2e/cli-smoke.test.ts` → **`golden path: monorepo + cursor,claude-code,codex (artifact set)`**.

---

## CI / e2e

Tests in `tests/e2e/cli-smoke.test.ts` run these flows with `--skip-skill-extraction` to avoid calling external AI CLIs. End users should run **`harn init` without that flag** unless they intentionally want to extract skills manually later.

| Golden path doc § | Vitest test name (same file) |
|-------------------|------------------------------|
| [§1 Backend](#1--backend-service-cursor--claude-code) | `init, doctor, update --dry-run, verify` |
| [§2 Frontend](#2--frontend-app-cursor--codex) | `golden path: frontend + cursor,codex (artifact set)` |
| [§3 Monorepo](#3--monorepo--team-standardization-cursor--claude-code--codex) | `golden path: monorepo + cursor,claude-code,codex (artifact set)` |
