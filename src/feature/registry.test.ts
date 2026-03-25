import { describe, it, expect } from "vitest";
import { FeatureRegistry } from "./registry.js";
import type { FeatureSpec } from "./types.js";

const sampleFeatures: FeatureSpec[] = [
  { id: "hooks", key: "hooks_enabled", stage: "stable", defaultEnabled: true, description: "Lifecycle hooks" },
  { id: "plugins", key: "plugins_enabled", stage: "experimental", defaultEnabled: false, description: "Plugin system" },
  { id: "old-ui", key: "old_ui", stage: "deprecated", defaultEnabled: false, description: "Legacy UI" },
  { id: "ancient", key: "ancient_feature", stage: "removed", defaultEnabled: true, description: "Gone feature" },
];

describe("FeatureRegistry", () => {
  it("registers and lists features", () => {
    const reg = new FeatureRegistry();
    reg.registerMany(sampleFeatures);
    expect(reg.list()).toHaveLength(4);
  });

  it("checks default enabled state", () => {
    const reg = new FeatureRegistry();
    reg.registerMany(sampleFeatures);
    expect(reg.isEnabled("hooks")).toBe(true);
    expect(reg.isEnabled("plugins")).toBe(false);
  });

  it("applies overrides", () => {
    const reg = new FeatureRegistry();
    reg.registerMany(sampleFeatures);
    reg.applyOverrides({ plugins_enabled: true });
    expect(reg.isEnabled("plugins")).toBe(true);
  });

  it("returns false for unknown features", () => {
    const reg = new FeatureRegistry();
    expect(reg.isEnabled("nonexistent")).toBe(false);
  });

  it("lists by stage", () => {
    const reg = new FeatureRegistry();
    reg.registerMany(sampleFeatures);
    expect(reg.listByStage("experimental")).toHaveLength(1);
    expect(reg.listByStage("stable")).toHaveLength(1);
    expect(reg.listByStage("removed")).toHaveLength(1);
  });

  it("counts enabled and disabled", () => {
    const reg = new FeatureRegistry();
    reg.registerMany(sampleFeatures);
    const counts = reg.count();
    expect(counts.total).toBe(4);
    expect(counts.enabled).toBe(1);
    expect(counts.disabled).toBe(3);
  });

  it("gets feature by id", () => {
    const reg = new FeatureRegistry();
    reg.registerMany(sampleFeatures);
    const f = reg.get("hooks");
    expect(f?.key).toBe("hooks_enabled");
  });

  it("removed features are always disabled", () => {
    const reg = new FeatureRegistry();
    reg.registerMany(sampleFeatures);
    expect(reg.isEnabled("ancient")).toBe(false);
  });

  it("removed features cannot be overridden", () => {
    const reg = new FeatureRegistry();
    reg.registerMany(sampleFeatures);
    reg.applyOverrides({ ancient_feature: true });
    expect(reg.isEnabled("ancient")).toBe(false);
  });

  it("resolves legacy aliases", () => {
    const reg = new FeatureRegistry();
    reg.registerMany(sampleFeatures);
    reg.registerAlias("old_hooks", "hooks");

    expect(reg.isEnabled("old_hooks")).toBe(true);
    expect(reg.get("old_hooks")?.id).toBe("hooks");
  });

  it("registers multiple aliases", () => {
    const reg = new FeatureRegistry();
    reg.registerMany(sampleFeatures);
    reg.registerAliases({ legacy_plugins: "plugins", v1_hooks: "hooks" });

    expect(reg.isEnabled("v1_hooks")).toBe(true);
    expect(reg.isEnabled("legacy_plugins")).toBe(false);
  });

  it("tracks alias usages", () => {
    const reg = new FeatureRegistry();
    reg.registerMany(sampleFeatures);
    reg.registerAlias("old_hooks", "hooks");

    reg.isEnabled("old_hooks");
    const usages = reg.getAliasUsages();
    expect(usages.length).toBeGreaterThan(0);
    expect(usages[0]).toContain("old_hooks");
  });
});
