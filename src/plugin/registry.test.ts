import { describe, it, expect } from "vitest";
import { PluginRegistry } from "./registry.js";
import type { HarnessPlugin } from "./types.js";

const testPlugin: HarnessPlugin = {
  name: "test-plugin",
  version: "1.0.0",
  agents: [
    { name: "custom-agent", domain: "custom", tier: "medium" },
  ],
  hooks: [
    { event: "verify.post", command: "echo done" },
  ],
  healthChecks: [
    { name: "custom-check", check: async () => ({ status: "pass", message: "ok" }) },
  ],
  features: [
    { id: "custom-feat", key: "custom_feat", stage: "experimental", defaultEnabled: false, description: "Custom" },
  ],
  skillDirectories: ["vendor/skills"],
};

describe("PluginRegistry", () => {
  it("registers and retrieves a plugin", () => {
    const reg = new PluginRegistry();
    reg.register(testPlugin);
    expect(reg.get("test-plugin")).toBeDefined();
    expect(reg.count()).toBe(1);
  });

  it("lists all plugins", () => {
    const reg = new PluginRegistry();
    reg.register(testPlugin);
    expect(reg.list()).toHaveLength(1);
  });

  it("collects agents from plugins", () => {
    const reg = new PluginRegistry();
    reg.register(testPlugin);
    const agents = reg.collectAgents();
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe("custom-agent");
  });

  it("collects hooks from plugins", () => {
    const reg = new PluginRegistry();
    reg.register(testPlugin);
    expect(reg.collectHooks()).toHaveLength(1);
  });

  it("collects health checks from plugins", () => {
    const reg = new PluginRegistry();
    reg.register(testPlugin);
    expect(reg.collectHealthChecks()).toHaveLength(1);
  });

  it("collects features from plugins", () => {
    const reg = new PluginRegistry();
    reg.register(testPlugin);
    expect(reg.collectFeatures()).toHaveLength(1);
  });

  it("collects skill directories from plugins", () => {
    const reg = new PluginRegistry();
    reg.register(testPlugin);
    expect(reg.collectSkillDirectories()).toEqual(["vendor/skills"]);
  });

  it("returns empty collections for no plugins", () => {
    const reg = new PluginRegistry();
    expect(reg.collectAgents()).toHaveLength(0);
    expect(reg.collectHooks()).toHaveLength(0);
    expect(reg.count()).toBe(0);
  });
});
