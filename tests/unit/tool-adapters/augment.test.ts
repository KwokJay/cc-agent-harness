import { describe, it, expect } from "vitest";
import { AugmentAdapter } from "../../../src/tool-adapters/augment.js";
import type { ToolAdapterContext } from "../../../src/tool-adapters/types.js";

function makeCtx(overrides: Partial<ToolAdapterContext> = {}): ToolAdapterContext {
  return {
    projectName: "test-project",
    project: { type: "backend", language: "go", signals: [] },
    agentsMdContent: "",
    commands: { test: "go test ./..." },
    verificationChecks: ["test"],
    customRules: ["Follow Go conventions"],
    skills: ["go-conventions"],
    skillContents: [
      { name: "go-conventions", description: "Go rules", body: "Use gofmt." },
    ],
    ...overrides,
  };
}

describe("AugmentAdapter", () => {
  const adapter = new AugmentAdapter();

  it("has correct id and label", () => {
    expect(adapter.id).toBe("augment");
    expect(adapter.label).toBe("Augment Code");
  });

  it("generates augment-guidelines.md at project root", () => {
    const files = adapter.generate(makeCtx());
    const guidelines = files.find((f) => f.path === "augment-guidelines.md");
    expect(guidelines).toBeDefined();
    expect(guidelines!.content).toContain("test-project");
    expect(guidelines!.content).toContain("go");
  });

  it("generates skill files at .augment/skills/", () => {
    const files = adapter.generate(makeCtx());
    const skill = files.find((f) => f.path === ".augment/skills/go-conventions/SKILL.md");
    expect(skill).toBeDefined();
    expect(skill!.content).toContain("Use gofmt.");
    expect(skill!.content).toContain("name: go-conventions");
  });

  it("file count is 1 + skillContents.length", () => {
    const files = adapter.generate(makeCtx());
    expect(files.length).toBe(2);
  });

  it("guidelines include verification commands", () => {
    const files = adapter.generate(makeCtx());
    const guidelines = files.find((f) => f.path === "augment-guidelines.md");
    expect(guidelines!.content).toContain("go test");
  });
});
