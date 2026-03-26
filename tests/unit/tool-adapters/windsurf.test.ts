import { describe, it, expect } from "vitest";
import { WindsurfAdapter } from "../../../src/tool-adapters/windsurf.js";
import type { ToolAdapterContext } from "../../../src/tool-adapters/types.js";

function makeCtx(overrides: Partial<ToolAdapterContext> = {}): ToolAdapterContext {
  return {
    projectName: "test-project",
    project: { type: "backend", language: "typescript", signals: [] },
    agentsMdContent: "",
    commands: { lint: "pnpm lint", test: "pnpm test" },
    verificationChecks: ["lint", "test"],
    customRules: ["Use strict mode"],
    skills: ["typescript-conventions"],
    skillContents: [
      { name: "typescript-conventions", description: "TS rules", body: "Use strict." },
    ],
    ...overrides,
  };
}

describe("WindsurfAdapter", () => {
  const adapter = new WindsurfAdapter();

  it("has correct id and label", () => {
    expect(adapter.id).toBe("windsurf");
    expect(adapter.label).toBe("Windsurf");
  });

  it("generates project rules file", () => {
    const files = adapter.generate(makeCtx());
    const project = files.find((f) => f.path === ".windsurf/rules/project.md");
    expect(project).toBeDefined();
    expect(project!.content).toContain("test-project");
    expect(project!.content).toContain("typescript");
  });

  it("generates skill files", () => {
    const files = adapter.generate(makeCtx());
    const skill = files.find((f) => f.path.includes("skill-typescript-conventions"));
    expect(skill).toBeDefined();
    expect(skill!.content).toContain("Use strict.");
  });

  it("file count is 1 + skillContents.length", () => {
    const files = adapter.generate(makeCtx());
    expect(files.length).toBe(2);
  });

  it("all paths start with .windsurf/", () => {
    const files = adapter.generate(makeCtx());
    for (const f of files) {
      expect(f.path.startsWith(".windsurf/")).toBe(true);
    }
  });
});
