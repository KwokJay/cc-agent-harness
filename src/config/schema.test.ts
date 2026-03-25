import { describe, it, expect } from "vitest";
import { harnessConfigSchema } from "./schema.js";

describe("config schema", () => {
  it("validates a complete config", () => {
    const config = {
      project: { name: "test", language: "typescript" },
      agents: { delegation_first: true },
      skills: { directories: [".harness/skills"] },
    };
    const result = harnessConfigSchema.parse(config);
    expect(result.project.name).toBe("test");
    expect(result.agents.delegation_first).toBe(true);
    expect(result.agents.model_routing.low).toBe("low");
  });

  it("applies defaults for missing optional fields", () => {
    const config = { project: { name: "test" } };
    const result = harnessConfigSchema.parse(config);
    expect(result.project.language).toBe("typescript");
    expect(result.agents.delegation_first).toBe(true);
    expect(result.skills.directories).toEqual([".harness/skills"]);
    expect(result.workflows.verification.checks).toEqual(["build", "test", "lint"]);
    expect(result.templates.agents_md.variant).toBe("standard");
  });

  it("rejects invalid language", () => {
    const config = { project: { name: "test", language: "cobol" } };
    expect(() => harnessConfigSchema.parse(config)).toThrow();
  });

  it("rejects missing project name", () => {
    const config = { project: {} };
    expect(() => harnessConfigSchema.parse(config)).toThrow();
  });

  it("accepts custom agent definitions", () => {
    const config = {
      project: { name: "test" },
      agents: {
        definitions: [
          { name: "my-agent", domain: "custom", tier: "medium" },
        ],
      },
    };
    const result = harnessConfigSchema.parse(config);
    expect(result.agents.definitions).toHaveLength(1);
    expect(result.agents.definitions[0].name).toBe("my-agent");
  });
});
