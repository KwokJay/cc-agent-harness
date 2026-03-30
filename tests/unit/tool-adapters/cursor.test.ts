import { describe, it, expect } from "vitest";
import { CursorAdapter } from "../../../src/tool-adapters/cursor.js";
import type { ToolAdapterContext } from "../../../src/tool-adapters/types.js";
import { TOOL_CAPABILITIES } from "../../../src/tool-adapters/types.js";

function baseContext(
  overrides: Partial<ToolAdapterContext> = {},
): ToolAdapterContext {
  return {
    projectName: "demo-app",
    project: {
      type: "frontend",
      language: "typescript",
      framework: "vue",
      signals: ["package.json with vue"],
    },
    agentsMdContent: "",
    commands: { test: "pnpm test", lint: "pnpm run lint" },
    verificationChecks: ["test", "lint"],
    customRules: ["Follow existing patterns"],
    skills: [],
    skillContents: [],
    ...overrides,
  };
}

describe("CursorAdapter", () => {
  const adapter = new CursorAdapter();

  it("exposes first-class capability metadata aligned with TOOL_CAPABILITIES", () => {
    expect(adapter.capability).toBe(TOOL_CAPABILITIES.cursor);
    expect(adapter.capability.tier).toBe("first-class");
    expect(adapter.capability.mcp).toBe(true);
    expect(adapter.capability.extractionAuto).toBe(false);
  });

  it("generates project.mdc with frontmatter and project info", () => {
    const ctx = baseContext();
    const files = adapter.generate(ctx);
    const project = files.find((f) => f.path === ".cursor/rules/project.mdc");
    expect(project).toBeDefined();
    expect(project!.content).toContain("alwaysApply: true");
    expect(project!.content).toContain("description: Project-level rules for demo-app");
    expect(project!.content).toContain("# Project: demo-app");
    expect(project!.content).toContain("- **Type**: frontend");
    expect(project!.content).toContain("- **Language**: typescript");
    expect(project!.content).toContain("- **Framework**: vue");
    expect(project!.content).toContain("- Follow existing patterns");
  });

  it("generates coding.mdc with skill pack reference when skills exist", () => {
    const ctx = baseContext({ skills: ["changelog-governance"] });
    const files = adapter.generate(ctx);
    const coding = files.find((f) => f.path === ".cursor/rules/coding.mdc");
    expect(coding).toBeDefined();
    expect(coding!.content).toContain("alwaysApply: true");
    expect(coding!.content).toContain("## Skill Packs");
    expect(coding!.content).toContain("See .cursor/rules/skill-*.mdc");
  });

  it("generates one skill-*.mdc per skillContent", () => {
    const ctx = baseContext({
      skills: ["a", "b"],
      skillContents: [
        { name: "changelog", description: "Changelog rules", body: "## Changelog\nKeep it updated." },
        { name: "docs", description: "Docs rules", body: "## Docs\nWrite clearly." },
      ],
    });
    const files = adapter.generate(ctx);
    const skillFiles = files.filter((f) => f.path.startsWith(".cursor/rules/skill-"));
    expect(skillFiles.map((f) => f.path).sort()).toEqual([
      ".cursor/rules/skill-changelog.mdc",
      ".cursor/rules/skill-docs.mdc",
    ]);
    const changelog = skillFiles.find((f) => f.path.endsWith("skill-changelog.mdc"));
    expect(changelog!.content).toContain('description: "Skill: Changelog rules"');
    expect(changelog!.content).toContain("## Changelog");
  });

  it("emits 2 + skillContents.length files", () => {
    const ctx = baseContext({
      skillContents: [
        { name: "one", description: "One", body: "a" },
        { name: "two", description: "Two", body: "b" },
        { name: "three", description: "Three", body: "c" },
      ],
    });
    expect(adapter.generate(ctx)).toHaveLength(2 + ctx.skillContents.length);
  });

  it("uses only paths under .cursor/rules/", () => {
    const ctx = baseContext({
      skillContents: [{ name: "x", description: "X", body: "y" }],
    });
    for (const f of adapter.generate(ctx)) {
      expect(f.path.startsWith(".cursor/rules/")).toBe(true);
    }
  });

  it("includes verification commands in project rule content", () => {
    const ctx = baseContext();
    const project = adapter.generate(ctx).find((f) => f.path.endsWith("project.mdc"));
    expect(project!.content).toContain("## Verification");
    expect(project!.content).toContain("`pnpm test`");
    expect(project!.content).toContain("`pnpm run lint`");
  });
});
