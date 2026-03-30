# Shared policy toolpacks (multi-repo)

Some teams need the **same** governance snippets, MCP wiring, or skill templates in **many** repositories without copy-pasting generated files. A **shared policy** toolpack is still a normal `ToolpackPlugin` (npm or local), but it is **labeled** so registry and manifest consumers can treat it as org-wide policy rather than a one-off repo customization.

## How it differs from an ordinary pack

| Aspect | Ordinary pack | Shared policy pack |
|--------|----------------|-------------------|
| Purpose | Repo-specific optional wiring | Same package id/version rolled out across many repos |
| Contract | Same `generateFiles` / discovery rules | Optional `sharedPolicy: true` on the plugin |
| Discovery | builtin → npm → local precedence unchanged | Same precedence |
| Maintenance | Per-repo edits | Publish one npm package (or symlinked monorepo path) and bump version centrally |

Shared policy does **not** require a hosted service: install the npm package in each repo (or use a monorepo workspace) and list the pack id in `toolpacks:` as usual.

## Authoring

Set **`sharedPolicy: true`** on the exported `ToolpackPlugin` (or in **local** `.harness/toolpacks/<id>/plugin.json` as `"sharedPolicy": true`).

Example (npm — excerpt):

```javascript
module.exports = {
  id: "acme-policy",
  name: "ACME AI policy",
  sharedPolicy: true,
  // ... rest of ToolpackPlugin
};
```

Example (local `plugin.json`):

```json
{
  "id": "acme-policy-local",
  "name": "ACME policy (local fork)",
  "sharedPolicy": true,
  "category": "engineering-support",
  "version": "1.0.0"
}
```

The harness **does not** enforce rollout; it only **surfaces** the flag in the registry and in `.harness/manifest.json` toolpack entries so CI and org tooling can filter “policy” packs.

## Overrides and repo-specific drift

Repo-specific files (e.g. one-off `.cursor` tweaks) stay in the repo. Use **`approved_exceptions`** in `.harness/config.yaml` for machine-readable, aggregation-friendly exemptions (see [MANIFEST.md](./MANIFEST.md)). That avoids forking the whole harness to document a deliberate difference.

## Aggregation

To correlate manifests across repositories, set optional **`aggregation`** in config (`org`, `repo_slug`). Those fields are copied into the manifest for external tooling. See [MANIFEST.md](./MANIFEST.md).
