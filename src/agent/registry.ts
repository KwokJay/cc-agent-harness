import { BUILT_IN_AGENTS } from "../config/defaults.js";
import type { AgentDefinition } from "../config/schema.js";

export class AgentRegistry {
  private agents: Map<string, AgentDefinition>;

  constructor(customAgents: AgentDefinition[] = []) {
    this.agents = new Map();
    for (const agent of BUILT_IN_AGENTS) {
      this.agents.set(agent.name, agent);
    }
    for (const agent of customAgents) {
      this.agents.set(agent.name, agent);
    }
  }

  get(name: string): AgentDefinition | undefined {
    return this.agents.get(name);
  }

  list(): AgentDefinition[] {
    return [...this.agents.values()];
  }

  listByDomain(domain: string): AgentDefinition[] {
    return this.list().filter((a) => a.domain === domain);
  }

  listByTier(tier: string): AgentDefinition[] {
    return this.list().filter((a) => a.tier === tier);
  }

  domains(): string[] {
    return [...new Set(this.list().map((a) => a.domain))];
  }

  count(): { builtin: number; custom: number; total: number } {
    const builtin = BUILT_IN_AGENTS.length;
    const total = this.agents.size;
    return { builtin, custom: total - builtin, total };
  }
}
