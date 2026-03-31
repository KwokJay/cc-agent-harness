import { describe, it, expect } from "vitest";
import { generateHarnessFiles } from "../../../src/scaffold/harness-config.js";

const baseProject = {
  type: "backend" as const,
  language: "typescript",
  signals: [],
};

describe("generateHarnessFiles", () => {
  it("returns a single config file at .harness/config.yaml", () => {
    const files = generateHarnessFiles({
      projectName: "test-project",
      projectType: "backend",
      project: baseProject,
      tools: ["cursor"],
      commands: { dev: "npm run dev", build: "npm run build" },
      checks: ["lint", "test"],
      rules: ["No console.log"],
    });
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe(".harness/config.yaml");
    expect(files[0].source).toBe("harness-config");
  });

  it("includes project metadata in YAML content", () => {
    const files = generateHarnessFiles({
      projectName: "my-api",
      projectType: "backend",
      project: { ...baseProject, framework: "express" },
      tools: ["cursor"],
      commands: { dev: "npm run dev" },
      checks: [],
      rules: [],
    });
    const content = files[0].content;
    expect(content).toContain("name: my-api");
    expect(content).toContain("type: backend");
    expect(content).toContain("language: typescript");
    expect(content).toContain("framework: express");
  });

  it("includes tools, commands, checks, and rules", () => {
    const files = generateHarnessFiles({
      projectName: "svc",
      projectType: "backend",
      project: baseProject,
      tools: ["cursor", "claude-code"],
      commands: { dev: "npm run dev", build: "npm run build" },
      checks: ["lint", "typecheck"],
      rules: ["Rule A", "Rule B"],
    });
    const content = files[0].content;
    expect(content).toContain("cursor");
    expect(content).toContain("claude-code");
    expect(content).toContain("npm run dev");
    expect(content).toContain("lint");
    expect(content).toContain("Rule A");
    expect(content).toContain("Rule B");
  });

  it("includes toolpacks when provided", () => {
    const files = generateHarnessFiles({
      projectName: "svc",
      projectType: "backend",
      project: baseProject,
      tools: ["cursor"],
      commands: {},
      checks: [],
      rules: [],
      toolpacks: ["pack-a", "pack-b"],
    });
    const content = files[0].content;
    expect(content).toContain("pack-a");
    expect(content).toContain("pack-b");
  });

  it("includes skip_docs when skipDocs is true", () => {
    const files = generateHarnessFiles({
      projectName: "svc",
      projectType: "backend",
      project: baseProject,
      tools: ["cursor"],
      commands: {},
      checks: [],
      rules: [],
      skipDocs: true,
    });
    expect(files[0].content).toContain("skip_docs");
  });

  it("omits skip_docs when skipDocs is false or unset", () => {
    const files = generateHarnessFiles({
      projectName: "svc",
      projectType: "backend",
      project: baseProject,
      tools: ["cursor"],
      commands: {},
      checks: [],
      rules: [],
    });
    expect(files[0].content).not.toContain("skip_docs");
  });
});
