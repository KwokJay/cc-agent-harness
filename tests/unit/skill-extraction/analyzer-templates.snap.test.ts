import { describe, expect, it } from "vitest";
import { renderProjectAnalysisDoc } from "../../../src/templates/skills/project-analysis.js";
import { renderSkillIndexDoc } from "../../../src/templates/skills/skill-index.js";
import { renderExtractionTaskDoc } from "../../../src/templates/skills/extraction-task.js";

describe("analyzer meta templates (snapshots)", () => {
  it("PROJECT-ANALYSIS.md", () => {
    expect(
      renderProjectAnalysisDoc({
        projectName: "fixture-app",
        generatedDate: "2030-06-01",
        projectType: "backend",
        projectLanguage: "typescript",
        hasFramework: true,
        projectFramework: "nestjs",
        projectSignals: "package.json, tsconfig.json",
        directoryLines: ["- src/: app, main.ts", "- test/: (empty)"],
        skillLines: ["- **typescript-conventions** (technical): TypeScript usage"],
        hasWorkspacePackages: false,
        workspacePackageLines: [],
      }),
    ).toMatchSnapshot();
  });

  it("INDEX.md", () => {
    expect(
      renderSkillIndexDoc({
        projectName: "fixture-app",
        generatedDate: "2030-06-01",
        technical: [{ name: "typescript-conventions", summary: "TypeScript usage" }],
        business: [{ name: "domain-rules", summary: "Domain validation" }],
      }),
    ).toMatchSnapshot();
  });

  it("EXTRACTION-TASK.md", () => {
    expect(
      renderExtractionTaskDoc({
        projectName: "fixture-app",
        projectSummaryLine: "backend / typescript / nestjs",
        existingList: "- typescript-conventions (technical)",
        hasWorkspacePackages: false,
      }),
    ).toMatchSnapshot();
  });
});
