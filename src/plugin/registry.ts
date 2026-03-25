import type { HarnessPlugin } from "./types.js";
import type { ProjectAdapter, HealthCheck } from "../adapter/interface.js";
import type { HookHandler } from "../hook/types.js";
import type { FeatureSpec } from "../feature/types.js";
import type { AgentDefinition } from "../config/schema.js";

export class PluginRegistry {
  private plugins: Map<string, HarnessPlugin> = new Map();

  register(plugin: HarnessPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  get(name: string): HarnessPlugin | undefined {
    return this.plugins.get(name);
  }

  list(): HarnessPlugin[] {
    return [...this.plugins.values()];
  }

  collectAdapters(): ProjectAdapter[] {
    const adapters: ProjectAdapter[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.adapters) adapters.push(...plugin.adapters);
    }
    return adapters;
  }

  collectAgents(): AgentDefinition[] {
    const agents: AgentDefinition[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.agents) agents.push(...plugin.agents);
    }
    return agents;
  }

  collectHooks(): HookHandler[] {
    const hooks: HookHandler[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.hooks) hooks.push(...plugin.hooks);
    }
    return hooks;
  }

  collectHealthChecks(): HealthCheck[] {
    const checks: HealthCheck[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.healthChecks) checks.push(...plugin.healthChecks);
    }
    return checks;
  }

  collectFeatures(): FeatureSpec[] {
    const features: FeatureSpec[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.features) features.push(...plugin.features);
    }
    return features;
  }

  collectSkillDirectories(): string[] {
    const dirs: string[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.skillDirectories) dirs.push(...plugin.skillDirectories);
    }
    return dirs;
  }

  count(): number {
    return this.plugins.size;
  }
}
