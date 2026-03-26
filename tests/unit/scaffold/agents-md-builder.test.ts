import { describe, it, expect } from "vitest";
import { buildAgentsMd } from "../../../src/scaffold/agents-md-builder.js";
import type { DetectedProject } from "../../../src/project-types/types.js";

const baseProject: DetectedProject = {
  type: "backend",
  language: "typescript",
  signals: ["fixture"],
};

describe("buildAgentsMd", () => {
  it("starts with the project title heading", () => {
    const md = buildAgentsMd({
      projectName: "acme-api",
      project: baseProject,
      commands: { test: "npm test" },
      verificationChecks: ["test"],
      customRules: [],
      skills: [],
    });
    expect(md.startsWith("# acme-api\n")).toBe(true);
  });

  it("includes Project Info with type and language", () => {
    const md = buildAgentsMd({
      projectName: "svc",
      project: baseProject,
      commands: {},
      verificationChecks: [],
      customRules: [],
      skills: [],
    });
    expect(md).toContain("## Project Info");
    expect(md).toContain("- **Type**: backend");
    expect(md).toContain("- **Language**: typescript");
  });

  it("includes framework line when framework is set", () => {
    const md = buildAgentsMd({
      projectName: "ui",
      project: { ...baseProject, type: "frontend", framework: "react" },
      commands: {},
      verificationChecks: [],
      customRules: [],
      skills: [],
    });
    expect(md).toContain("- **Framework**: react");
  });

  it("includes Project-Specific Rules when customRules are non-empty", () => {
    const md = buildAgentsMd({
      projectName: "r",
      project: baseProject,
      commands: {},
      verificationChecks: [],
      customRules: ["One rule", "Two rule"],
      skills: [],
    });
    expect(md).toContain("## Project-Specific Rules");
    expect(md).toContain("- One rule");
    expect(md).toContain("- Two rule");
  });

  it("omits Project-Specific Rules when there are no custom rules", () => {
    const md = buildAgentsMd({
      projectName: "clean",
      project: baseProject,
      commands: { lint: "npm run lint" },
      verificationChecks: [],
      customRules: [],
      skills: [],
    });
    expect(md).not.toContain("## Project-Specific Rules");
  });

  it("renders the Available Commands table when commands exist", () => {
    const md = buildAgentsMd({
      projectName: "cmd",
      project: baseProject,
      commands: { build: "npm run build", test: "npm test" },
      verificationChecks: [],
      customRules: [],
      skills: [],
    });
    expect(md).toContain("## Available Commands");
    expect(md).toContain("| Command | Purpose |");
    expect(md).toContain("| `npm run build` | build |");
    expect(md).toContain("| `npm test` | test |");
  });

  it("includes Verification Protocol when checks exist", () => {
    const md = buildAgentsMd({
      projectName: "v",
      project: baseProject,
      commands: { test: "npm test", lint: "npm run lint" },
      verificationChecks: ["lint", "test"],
      customRules: [],
      skills: [],
    });
    expect(md).toContain("## Verification Protocol");
    expect(md).toContain("Before claiming any task is complete:");
    expect(md).toContain("1. Run `npm run lint` to verify lint.");
    expect(md).toContain("2. Run `npm test` to verify test.");
  });

  it("includes Skills when skills are provided", () => {
    const md = buildAgentsMd({
      projectName: "sk",
      project: baseProject,
      commands: {},
      verificationChecks: [],
      customRules: [],
      skills: ["alpha-skill", "beta-skill"],
    });
    expect(md).toContain("## Skills");
    expect(md).toContain("The following skill packs are available in `.harness/skills/`:");
    expect(md).toContain("- **alpha-skill**");
    expect(md).toContain("- **beta-skill**");
  });

  it("includes documentation and changelog constraint sections", () => {
    const md = buildAgentsMd({
      projectName: "constraints",
      project: baseProject,
      commands: {},
      verificationChecks: [],
      customRules: [],
      skills: [],
    });
    expect(md).toContain("## Documentation Rules");
    expect(md).toContain(".harness/docs/{feature-name}/");
    expect(md).toContain("## Changelog Rules");
    expect(md).toContain("CHANGELOG.md");
  });
});
