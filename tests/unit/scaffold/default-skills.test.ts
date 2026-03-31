import { describe, it, expect } from "vitest";
import { getDefaultSkills } from "../../../src/scaffold/default-skills.js";
import type { ProjectTypeId } from "../../../src/project-types/types.js";

describe("getDefaultSkills", () => {
  const cases: [ProjectTypeId, string[]][] = [
    ["frontend", ["frontend-conventions"]],
    ["backend", ["api-conventions"]],
    ["fullstack", ["fullstack-workflow"]],
    ["monorepo", ["monorepo-discipline"]],
    ["docs", ["docs-quality"]],
  ];

  for (const [projectType, expected] of cases) {
    it(`returns ${expected[0]} for ${projectType}`, () => {
      expect(getDefaultSkills(projectType)).toEqual(expected);
    });
  }
});
