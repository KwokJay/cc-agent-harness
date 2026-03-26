# Authoring npm toolpacks for Agent Harness

Toolpacks extend `agent-harness init` / `update` with extra generated files (for example MCP snippets). They can ship as **npm packages** so teams install them like any other dependency.

## Package naming

- Scoped: `@agent-harness/toolpack-<name>`
- Unscoped: `agent-harness-toolpack-<name>`

Harness discovers packages under `node_modules` matching those patterns.

## `package.json` contract

Add a nested field:

```json
{
  "name": "@agent-harness/toolpack-example",
  "version": "1.0.0",
  "main": "./plugin.cjs",
  "agent-harness": {
    "toolpack": {
      "id": "example",
      "main": "./plugin.cjs"
    }
  }
}
```

- **`agent-harness.toolpack.id`** — stable id used in `.harness/config.yaml` `toolpacks:` and `list toolpacks`.
- **`agent-harness.toolpack.main`** — CommonJS or ESM entry (via `createRequire`); must resolve from the package root.

## Exported plugin shape

The module should export a **`ToolpackPlugin`** object (default export or named `toolpack`):

| Field | Type | Notes |
|--------|------|--------|
| `id` | string | Should match `agent-harness.toolpack.id` |
| `name` | string | Short label |
| `description` | string | Shown in `list toolpacks` |
| `category` | string | One of harness categories (e.g. `engineering-support`, `context-engineering`, …) |
| `version` | string | Semver string |
| `relevantTools` | `ToolId[]` | Which AI tools this pack targets |
| `generateFiles` | function | `(tools, projectName, cwd) => GeneratedFile[]` |

`install` and `source` are set by Harness when loading npm packages; you do not need to set `source: "npm"` in the file.

## `generateFiles` contract

Return an array of `{ path, content, description }` paths relative to the project root — same as built-in toolpacks. Use only static content or read from `cwd`; avoid network I/O during generation.

## Resolution order

When the same `id` appears in **builtin**, **npm**, and **local** (`.harness/toolpacks/`), **local wins**, then npm over builtin for remaining ids. Prefer unique ids for published packages.

## Testing locally

In a fixture repo:

```bash
pnpm add ./path/to/your-toolpack
pnpm exec agent-harness list toolpacks
```

Ensure your package appears with `source=npm`.
