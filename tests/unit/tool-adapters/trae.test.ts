import { describe, it, expect } from "vitest";
import { TraeAdapter } from "../../../src/tool-adapters/trae.js";
import type { ToolAdapterContext } from "../../../src/tool-adapters/types.js";

function makeCtx(overrides: Partial<ToolAdapterContext> = {}): ToolAdapterContext {
  return {
    projectName: "test-project",
    project: { type: "frontend", language: "typescript", framework: "react", signals: [] },
    agentsMdContent: "",
    commands: { lint: "pnpm lint" },
    verificationChecks: ["lint"],
    customRules: ["Follow design system"],
    skills: ["react-conventions"],
    skillContents: [
      { name: "react-conventions", description: "React rules", body: "Use functional components." },
    ],
    ...overrides,
  };
}

describe("TraeAdapter", () => {
  const adapter = new TraeAdapter();

  it("has correct id and label", () => {
    expect(adapter.id).toBe("trae");
    expect(adapter.label).toBe("Trae");
  });

  it("generates project rules file at .trae/rules/project.md", () => {
    const files = adapter.generate(makeCtx());
    const project = files.find((f) => f.path === ".trae/rules/project.md");
    expect(project).toBeDefined();
    expect(project!.content).toContain("test-project");
    expect(project!.content).toContain("react");
  });

  it("generates skill files at .trae/rules/skill-*.md", () => {
    const files = adapter.generate(makeCtx());
    const skill = files.find((f) => f.path.includes("skill-react-conventions"));
    expect(skill).toBeDefined();
    expect(skill!.path).toBe(".trae/rules/skill-react-conventions.md");
  });

  it("file count is 1 + skillContents.length", () => {
    const files = adapter.generate(makeCtx());
    expect(files.length).toBe(2);
  });
});
