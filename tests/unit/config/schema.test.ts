import { describe, it, expect } from "vitest";
import { validateConfig } from "../../../src/config/schema.js";

function validConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    project: {
      name: "my-project",
      type: "backend",
      language: "typescript",
    },
    tools: ["cursor", "claude-code"],
    workflows: {
      commands: { lint: "pnpm lint", test: "pnpm test" },
      verification: { checks: ["lint", "test"] },
    },
    custom_rules: ["Use TypeScript strict mode"],
    ...overrides,
  };
}

describe("validateConfig", () => {
  it("passes for a valid config", () => {
    const result = validateConfig(validConfig());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.config).toBeDefined();
    expect(result.config!.project.name).toBe("my-project");
    expect(result.config!.tools).toEqual(["cursor", "claude-code"]);
  });

  it("rejects non-object input", () => {
    const result = validateConfig("not an object");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("YAML object");
  });

  it("rejects null input", () => {
    const result = validateConfig(null);
    expect(result.valid).toBe(false);
  });

  it("reports missing project section", () => {
    const result = validateConfig({ tools: ["cursor"] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("project"))).toBe(true);
  });

  it("reports invalid project type", () => {
    const result = validateConfig(validConfig({
      project: { name: "x", type: "alien", language: "ts" },
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("project.type"))).toBe(true);
  });

  it("reports missing tools array", () => {
    const result = validateConfig(validConfig({ tools: "cursor" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("tools"))).toBe(true);
  });

  it("reports unknown tool", () => {
    const result = validateConfig(validConfig({ tools: ["cursor", "unknown-tool"] }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("unknown-tool"))).toBe(true);
  });

  it("accepts optional fields when absent", () => {
    const config = {
      project: { name: "x", type: "frontend", language: "typescript" },
      tools: ["cursor"],
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(true);
    expect(result.config!.toolpacks).toBeUndefined();
    expect(result.config!.skip_docs).toBeUndefined();
    expect(result.config!.custom_rules).toBeUndefined();
  });

  it("validates toolpacks as array", () => {
    const result = validateConfig(validConfig({ toolpacks: "not-array" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("toolpacks"))).toBe(true);
  });

  it("validates skip_docs as boolean", () => {
    const result = validateConfig(validConfig({ skip_docs: "yes" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("skip_docs"))).toBe(true);
  });

  it("validates generated_files as array", () => {
    const result = validateConfig(validConfig({ generated_files: 42 }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("generated_files"))).toBe(true);
  });

  it("passes with all valid optional fields", () => {
    const result = validateConfig(validConfig({
      toolpacks: ["context-mode"],
      skip_docs: true,
      generated_files: ["AGENTS.md", ".cursor/rules/project.mdc"],
    }));
    expect(result.valid).toBe(true);
    expect(result.config!.toolpacks).toEqual(["context-mode"]);
    expect(result.config!.skip_docs).toBe(true);
    expect(result.config!.generated_files).toEqual(["AGENTS.md", ".cursor/rules/project.mdc"]);
  });

  it("accepts framework as optional string", () => {
    const result = validateConfig(validConfig({
      project: { name: "x", type: "frontend", language: "typescript", framework: "react" },
    }));
    expect(result.valid).toBe(true);
    expect(result.config!.project.framework).toBe("react");
  });
});
