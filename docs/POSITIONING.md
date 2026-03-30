# Positioning

This document turns validated ICP hypotheses (see `.planning/phases/01-icp-and-golden-paths/ICP-VALIDATION.md`) into product-facing positioning. It is the source of truth for **who should adopt** cc-agent-harness and **what we explicitly do not solve**.

## POS-01 traceability (3 ICPs)

Requirement **POS-01** needs three primary ICPs, each with **pains**, **promised outcomes**, and **explicit non-goals**. The sections below satisfy that bar; this table is the audit index.

| ICP | Where to read (same section lists pains, outcomes, non-goals) |
|-----|----------------------------------------------------------------|
| **A** — Multi-repo technical lead | [ICP A](#icp-a--multi-repo-technical-lead) |
| **B** — AI-first standards champion | [ICP B](#icp-b--ai-first-standards-champion) |
| **C** — Open source maintainer | [ICP C](#icp-c--open-source-maintainer) |

## Who this is for / Who this is NOT for

| For | Not for |
|-----|---------|
| Teams or leads managing **multiple repos** and **2+ AI coding tools** who need one repeatable way to scaffold rules and skills | Teams that use **a single editor** with no need to sync artifacts across tools |
| **Platform / standards champions** who want verify/manifest/export-style governance hooks and documented golden paths | Buyers looking for a **hosted** governance SaaS (this is repo-local and CLI-first) |
| **OSS maintainers** who want contributors to land in a consistent harness (AGENTS.md, per-tool rules) with clear boundaries | Organizations that will not allow generated files in-repo |

---

## ICP A — Multi-repo technical lead

- **Pains:** Per-repo drift of AI prompts and rules; manual copy-paste; hard to onboard new services with the same standard; juggling Cursor, Claude Code, Codex, etc.
- **Promised outcomes:** One CLI (`harn init`, `harn update`) that writes each tool’s native paths from a single harness config; [Golden paths](./GOLDEN-PATHS.md) for backend, frontend, and monorepo.
- **Non-goals:** Replacing your code review or CI platform; remote policy enforcement without files in the repo.

## ICP B — AI-first standards champion

- **Pains:** No neutral “harness layer” docs can point to; audits need something machine-readable; teams ask “what do we run to check we’re compliant?”
- **Promised outcomes:** `harn verify`, `harn manifest`, `harn export`, `harn diagnose` as governance-adjacent commands; alignment with [MANIFEST.md](./MANIFEST.md) and CI examples.
- **Non-goals:** Full compliance framework (SOC2, etc.); automatic fixes for all policy violations.

## ICP C — Open source maintainer

- **Pains:** Contributors use different tools; README instructions don’t match actual on-disk expectations; weak shared constraints for AI usage.
- **Promised outcomes:** Documented [capability tiers](./CAPABILITY-MATRIX.md) (first-class vs baseline tools); scaffolded AGENTS.md + tool-specific rules; optional skill extraction where CLIs exist.
- **Non-goals:** Guaranteeing contributor environments have every vendor CLI installed; shipping vendor-specific proprietary configs.

---

## Related

- [CAPABILITY-MATRIX.md](./CAPABILITY-MATRIX.md) — tool-by-tool support surface.
- [GOLDEN-PATHS.md](./GOLDEN-PATHS.md) — copy-paste flows and expected artifacts.
