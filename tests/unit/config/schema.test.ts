import { describe, it, expect } from "vitest";
import { validateConfig, HarnessConfigSchema } from "../../../src/config/schema.js";

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

  it("accepts aggregation and approved_exceptions", () => {
    const result = validateConfig(
      validConfig({
        aggregation: { org: "acme", repo_slug: "billing-api" },
        approved_exceptions: [
          { id: "legacy-mcp", description: "Org-managed MCP", target: ".cursor/mcp.json" },
        ],
      }),
    );
    expect(result.valid).toBe(true);
    expect(result.config!.aggregation).toEqual({ org: "acme", repo_slug: "billing-api" });
    expect(result.config!.approved_exceptions).toHaveLength(1);
  });

  it("rejects approved_exceptions without id", () => {
    const result = validateConfig(validConfig({ approved_exceptions: [{ description: "x" }] }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("approved_exceptions"))).toBe(true);
  });

  it("rejects invalid aggregation type", () => {
    const result = validateConfig(validConfig({ aggregation: "acme" }));
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Zod-specific edge-case tests
// ---------------------------------------------------------------------------

describe("validateConfig — Zod edge cases", () => {
  it("strips unknown top-level fields (passthrough then construct)", () => {
    const result = validateConfig(validConfig({ unknown_field: "hello" }));
    expect(result.valid).toBe(true);
    // unknown_field should not appear in the output config
    expect((result.config as Record<string, unknown>)["unknown_field"]).toBeUndefined();
  });

  it("rejects array input at top level", () => {
    const result = validateConfig([1, 2, 3]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("YAML object");
  });

  it("provides default workflows when workflows is absent", () => {
    const config = {
      project: { name: "x", type: "frontend", language: "typescript" },
      tools: ["cursor"],
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(true);
    expect(result.config!.workflows.commands).toEqual({});
    expect(result.config!.workflows.verification.checks).toEqual([]);
  });

  it("provides default workflows.commands when only verification is present", () => {
    const result = validateConfig(validConfig({
      workflows: { verification: { checks: ["test"] } },
    }));
    expect(result.valid).toBe(true);
    expect(result.config!.workflows.commands).toEqual({});
    expect(result.config!.workflows.verification.checks).toEqual(["test"]);
  });

  it("provides default workflows.verification.checks when only commands is present", () => {
    const result = validateConfig(validConfig({
      workflows: { commands: { lint: "pnpm lint" } },
    }));
    expect(result.valid).toBe(true);
    expect(result.config!.workflows.commands).toEqual({ lint: "pnpm lint" });
    expect(result.config!.workflows.verification.checks).toEqual([]);
  });

  it("handles empty tools array", () => {
    const result = validateConfig(validConfig({ tools: [] }));
    expect(result.valid).toBe(true);
    expect(result.config!.tools).toEqual([]);
  });

  it("handles empty custom_rules array", () => {
    const result = validateConfig(validConfig({ custom_rules: [] }));
    expect(result.valid).toBe(true);
    expect(result.config!.custom_rules).toEqual([]);
  });

  it("handles empty generated_files array", () => {
    const result = validateConfig(validConfig({ generated_files: [] }));
    expect(result.valid).toBe(true);
    expect(result.config!.generated_files).toEqual([]);
  });

  it("handles empty approved_exceptions array", () => {
    const result = validateConfig(validConfig({ approved_exceptions: [] }));
    expect(result.valid).toBe(true);
    expect(result.config!.approved_exceptions).toEqual([]);
  });

  it("accepts project.name with whitespace (matches original behavior)", () => {
    const result = validateConfig(validConfig({
      project: { name: "   ", type: "backend", language: "ts" },
    }));
    // Original code uses !p.name which is truthy for "   "
    expect(result.valid).toBe(true);
  });

  it("rejects skip_docs with numeric value", () => {
    const result = validateConfig(validConfig({ skip_docs: 1 }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("skip_docs"))).toBe(true);
  });

  it("rejects toolpacks with object value", () => {
    const result = validateConfig(validConfig({ toolpacks: { a: 1 } }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("toolpacks"))).toBe(true);
  });

  it("rejects aggregation with array value", () => {
    const result = validateConfig(validConfig({ aggregation: [1, 2] }));
    expect(result.valid).toBe(false);
  });

  it("rejects approved_exception item with whitespace-only id", () => {
    const result = validateConfig(validConfig({
      approved_exceptions: [{ id: "  " }],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("approved_exceptions"))).toBe(true);
  });

  it("validates aggregation with only org", () => {
    const result = validateConfig(validConfig({
      aggregation: { org: "acme" },
    }));
    expect(result.valid).toBe(true);
    expect(result.config!.aggregation).toEqual({ org: "acme" });
    expect(result.config!.aggregation!.repo_slug).toBeUndefined();
  });

  it("validates aggregation with only repo_slug", () => {
    const result = validateConfig(validConfig({
      aggregation: { repo_slug: "my-repo" },
    }));
    expect(result.valid).toBe(true);
    expect(result.config!.aggregation).toEqual({ repo_slug: "my-repo" });
    expect(result.config!.aggregation!.org).toBeUndefined();
  });

  it("rejects non-string in tools array", () => {
    const result = validateConfig(validConfig({ tools: ["cursor", 123] }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("non-string"))).toBe(true);
  });

  it("HarnessConfigSchema safeParse succeeds on valid input", () => {
    const result = HarnessConfigSchema.safeParse(validConfig());
    expect(result.success).toBe(true);
  });

  it("HarnessConfigSchema safeParse fails on invalid input", () => {
    const result = HarnessConfigSchema.safeParse({ tools: "not-array" });
    expect(result.success).toBe(false);
  });
});
