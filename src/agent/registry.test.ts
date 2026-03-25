import { describe, it, expect } from "vitest";
import { AgentRegistry } from "./registry.js";

describe("AgentRegistry", () => {
  it("loads all 32 built-in agents", () => {
    const registry = new AgentRegistry();
    expect(registry.count().builtin).toBe(32);
    expect(registry.count().total).toBe(32);
  });

  it("can look up an agent by name", () => {
    const registry = new AgentRegistry();
    const agent = registry.get("executor");
    expect(agent).toBeDefined();
    expect(agent!.tier).toBe("sonnet");
    expect(agent!.domain).toBe("execution");
  });

  it("returns undefined for unknown agent", () => {
    const registry = new AgentRegistry();
    expect(registry.get("nonexistent")).toBeUndefined();
  });

  it("includes custom agents", () => {
    const registry = new AgentRegistry([
      { name: "my-agent", domain: "custom", tier: "opus" },
    ]);
    expect(registry.count().custom).toBe(1);
    expect(registry.count().total).toBe(33);
    expect(registry.get("my-agent")).toBeDefined();
  });

  it("custom agent overrides built-in with same name", () => {
    const registry = new AgentRegistry([
      { name: "executor", domain: "custom-execution", tier: "opus" },
    ]);
    const agent = registry.get("executor");
    expect(agent!.domain).toBe("custom-execution");
    expect(agent!.tier).toBe("opus");
  });

  it("lists agents by domain", () => {
    const registry = new AgentRegistry();
    const executors = registry.listByDomain("execution");
    expect(executors).toHaveLength(3);
  });

  it("lists agents by tier", () => {
    const registry = new AgentRegistry();
    const opusAgents = registry.listByTier("opus");
    expect(opusAgents.length).toBeGreaterThan(5);
  });

  it("lists unique domains", () => {
    const registry = new AgentRegistry();
    const domains = registry.domains();
    expect(domains).toContain("execution");
    expect(domains).toContain("analysis");
    expect(domains).toContain("frontend");
  });
});
