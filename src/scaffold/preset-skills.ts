import type { ProjectTypeId } from "../project-types/types.js";
import type { GeneratedFile, SkillContent } from "../tool-adapters/types.js";

const SKILL_MAP: Record<ProjectTypeId, { name: string; description: string; content: string }> = {
  frontend: {
    name: "frontend-conventions",
    description: "Frontend development conventions and component patterns",
    content: "# Frontend Conventions\n\n- Use functional components with hooks.\n- Keep components small and focused on a single responsibility.\n- Co-locate tests with components.\n- Use CSS modules or utility classes; avoid inline styles.\n- Ensure all interactive elements are keyboard accessible.\n- Write meaningful alt text for images.",
  },
  backend: {
    name: "api-conventions",
    description: "API development conventions and error handling patterns",
    content: "# API Conventions\n\n- Use consistent HTTP status codes and error response shapes.\n- Validate all input at the boundary layer.\n- Write docstrings or JSDoc for public functions.\n- Use structured logging with correlation IDs.\n- Keep route handlers thin; delegate to service modules.\n- Write integration tests for critical endpoints.",
  },
  fullstack: {
    name: "fullstack-workflow",
    description: "Fullstack project coordination and shared conventions",
    content: "# Fullstack Workflow\n\n- Keep frontend and backend in clearly separated directories.\n- Share types or schemas between layers when possible.\n- Run both frontend and backend tests in CI.\n- Use API contracts to decouple frontend and backend work.\n- Prefer thin API routes that delegate to service logic.",
  },
  monorepo: {
    name: "monorepo-discipline",
    description: "Monorepo boundaries, dependency direction, and package hygiene",
    content: "# Monorepo Discipline\n\n- Respect package boundaries; do not import across packages without explicit dependency.\n- Keep shared utilities in a dedicated package.\n- Run only affected tests and builds when possible.\n- Use workspace protocols for internal dependencies.\n- Document each package's purpose in its own README.",
  },
  docs: {
    name: "docs-quality",
    description: "Documentation quality standards and writing conventions",
    content: "# Documentation Quality\n\n- Write in clear, concise language.\n- Use headings to create scannable structure.\n- Include code examples for technical concepts.\n- Keep sentences short; avoid jargon without explanation.\n- Proofread for grammar and consistency before publishing.",
  },
};

export function getSkillContents(projectType: ProjectTypeId): SkillContent[] {
  const skill = SKILL_MAP[projectType];
  if (!skill) return [];
  return [{ name: skill.name, description: skill.description, body: skill.content }];
}

export function generateSkillFiles(projectType: ProjectTypeId): GeneratedFile[] {
  const skill = SKILL_MAP[projectType];
  if (!skill) return [];

  const skillMd = `---\nname: ${skill.name}\ndescription: ${skill.description}\n---\n\n${skill.content}\n`;

  return [
    {
      path: `.harness/skills/${skill.name}/SKILL.md`,
      content: skillMd,
      description: `Preset skill (source): ${skill.name}`,
      harnessSkillSource: "preset",
    },
  ];
}
