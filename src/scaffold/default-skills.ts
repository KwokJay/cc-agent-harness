import type { ProjectTypeId } from "../project-types/types.js";

export function getDefaultSkills(projectType: ProjectTypeId): string[] {
  const map: Record<ProjectTypeId, string[]> = {
    frontend: ["frontend-conventions"],
    backend: ["api-conventions"],
    fullstack: ["fullstack-workflow"],
    monorepo: ["monorepo-discipline"],
    docs: ["docs-quality"],
  };
  return map[projectType] ?? [];
}
