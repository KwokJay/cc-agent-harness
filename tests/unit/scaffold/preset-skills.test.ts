import { describe, it, expect } from "vitest";
import { getSkillContents, generateSkillFiles } from "../../../src/scaffold/preset-skills.js";
import type { ProjectTypeId } from "../../../src/project-types/types.js";

const ALL_TYPES: ProjectTypeId[] = ["frontend", "backend", "fullstack", "monorepo", "docs"];

describe("getSkillContents", () => {
  it("returns one SkillContent entry per known project type", () => {
    for (const pt of ALL_TYPES) {
      const contents = getSkillContents(pt);
      expect(contents).toHaveLength(1);
      expect(contents[0].name).toBeTruthy();
      expect(contents[0].description).toBeTruthy();
      expect(contents[0].body).toBeTruthy();
    }
  });

  it("frontend skill has expected name", () => {
    const contents = getSkillContents("frontend");
    expect(contents[0].name).toBe("frontend-conventions");
  });

  it("backend skill has expected name", () => {
    const contents = getSkillContents("backend");
    expect(contents[0].name).toBe("api-conventions");
  });
});

describe("generateSkillFiles", () => {
  it("returns one GeneratedFile per known project type", () => {
    for (const pt of ALL_TYPES) {
      const files = generateSkillFiles(pt);
      expect(files).toHaveLength(1);
      expect(files[0].path).toMatch(/^\.harness\/skills\/.+\/SKILL\.md$/);
      expect(files[0].content).toContain("---");
      expect(files[0].harnessSkillSource).toBe("preset");
    }
  });

  it("frontend generates file at correct path", () => {
    const files = generateSkillFiles("frontend");
    expect(files[0].path).toBe(".harness/skills/frontend-conventions/SKILL.md");
    expect(files[0].content).toContain("name: frontend-conventions");
  });

  it("backend generates file at correct path", () => {
    const files = generateSkillFiles("backend");
    expect(files[0].path).toBe(".harness/skills/api-conventions/SKILL.md");
  });

  it("file content includes frontmatter and body", () => {
    const files = generateSkillFiles("fullstack");
    const content = files[0].content;
    expect(content).toContain("name: fullstack-workflow");
    expect(content).toContain("description:");
    expect(content).toContain("# Fullstack Workflow");
  });
});
