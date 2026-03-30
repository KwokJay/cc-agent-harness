# Capability matrix (AI tools)

This document mirrors **`TOOL_CAPABILITIES`** in [`src/tool-adapters/types.ts`](../src/tool-adapters/types.ts). If the two diverge, **the TypeScript record is authoritative** — update the code first, then this file.

Each [`ToolAdapter`](../src/tool-adapters/types.ts) exposes `readonly capability` pointing at the same row.

## Field meanings

| Field | Meaning |
|-------|---------|
| **tier** | `first-class` — Cursor, Claude Code, Codex (full product focus). `baseline` — other adapters (generation + manual workflows; fewer automated extras). |
| **generation** | Always `true`: scaffold emits tool-native paths for every supported `ToolId`. |
| **diagnose** | Tool-specific diagnostic integration in `harn diagnose` (e.g. Cursor MCP JSON when Cursor is an active configured tool). |
| **mcp** | `harn mcp merge` applies to this tool. **Only Cursor** is `true` today (`.cursor/mcp.json`). |
| **extractionAuto** | `harn init` Step 2 can invoke a **CLI** for automated skill extraction for this tool (see `invokeSkillExtraction`). |
| **extractionManualFallback** | Always `true`: users can still follow `.harness/skills/EXTRACTION-TASK.md` manually for any configured tool. |

## Matrix (code-backed)

| Tool | tier | generation | diagnose | mcp | extractionAuto | extractionManualFallback |
|------|------|------------|----------|-----|----------------|--------------------------|
| cursor | first-class | yes | yes | yes | no | yes |
| claude-code | first-class | yes | yes | no | yes | yes |
| codex | first-class | yes | yes | no | yes | yes |
| copilot | baseline | yes | no | no | no | yes |
| opencode | baseline | yes | no | no | no | yes |
| windsurf | baseline | yes | no | no | no | yes |
| trae | baseline | yes | no | no | no | yes |
| augment | baseline | yes | no | no | no | yes |

## Extraction priority vs automation

**Automation (`extractionAuto`):** only **claude-code** and **codex** expose a scripted CLI command in the invoker.

**Priority order** (when multiple tools are selected; see `src/skill-extraction/invoker.ts`):  
`claude-code` → `codex` → `cursor` → `copilot` → `opencode`  
Tools without a CLI command are skipped with an explicit reason (not silently treated as parity).

**Baseline tools** (windsurf, trae, augment): not in the priority list; rely on **manual** extraction and static scaffold output.

## Verify

`workflows.verification.checks` in `.harness/config.yaml` is tool-agnostic once configured.

## Implementation pointers

| Area | Location |
|------|----------|
| Capability rows | `TOOL_CAPABILITIES`, `getToolCapability()` in `src/tool-adapters/types.ts` |
| Adapters | `src/tool-adapters/*.ts` |
| Cursor MCP (Cursor-only) | `src/mcp/cursor-mcp.ts`, `src/cli/mcp.ts` |
| Extraction | `src/skill-extraction/invoker.ts` |

When in doubt, run `harn list tools` and `harn doctor` on your repo after `harn init`.
