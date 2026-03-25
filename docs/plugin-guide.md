# Plugin Guide

## Overview

Plugins extend agent-harness by contributing adapters, agents, hooks, health checks, features, and skill directories through a single unified interface.

## Writing a Plugin

Implement the `HarnessPlugin` interface:

```typescript
import type { HarnessPlugin } from "agent-harness";

export const myPlugin: HarnessPlugin = {
  name: "harness-plugin-example",
  version: "1.0.0",
  description: "Example harness plugin",

  agents: [
    { name: "custom-agent", domain: "custom", tier: "medium", description: "A custom agent" },
  ],

  hooks: [
    { event: "verify.post", command: "echo 'Verification complete!'" },
  ],

  healthChecks: [
    {
      name: "custom-service",
      check: async () => ({ status: "pass", message: "Custom service reachable" }),
    },
  ],

  features: [
    {
      id: "custom-feature",
      key: "custom_feature",
      stage: "experimental",
      defaultEnabled: false,
      description: "Enable custom feature behavior",
    },
  ],

  skillDirectories: ["vendor/custom-skills"],
};
```

## Registering Plugins

```typescript
import { PluginRegistry } from "agent-harness";
import { myPlugin } from "./my-plugin.js";

const plugins = new PluginRegistry();
plugins.register(myPlugin);

// Collect all capabilities from registered plugins
const agents = plugins.collectAgents();
const hooks = plugins.collectHooks();
const checks = plugins.collectHealthChecks();
const features = plugins.collectFeatures();
const skillDirs = plugins.collectSkillDirectories();
const adapters = plugins.collectAdapters();
```

## Plugin Interface

```typescript
interface HarnessPlugin {
  name: string;
  version?: string;
  description?: string;
  adapters?: ProjectAdapter[];
  agents?: AgentDefinition[];
  hooks?: HookHandler[];
  healthChecks?: HealthCheck[];
  features?: FeatureSpec[];
  skillDirectories?: string[];
}
```

## Plugin Capabilities

| Capability | Type | Effect |
|-----------|------|--------|
| `adapters` | `ProjectAdapter[]` | Register project type adapters |
| `agents` | `AgentDefinition[]` | Add custom agent definitions |
| `hooks` | `HookHandler[]` | Register lifecycle event handlers |
| `healthChecks` | `HealthCheck[]` | Add custom health checks to doctor |
| `features` | `FeatureSpec[]` | Register feature flags |
| `skillDirectories` | `string[]` | Add skill discovery directories |

## Creating a Compatibility Plugin

To support tools from another ecosystem (e.g., Codex skills):

```typescript
import type { HarnessPlugin } from "agent-harness";

export const codexCompatPlugin: HarnessPlugin = {
  name: "harness-plugin-codex-compat",
  description: "Discover skills from .codex/skills directory",
  skillDirectories: [".codex/skills"],
};
```
