import type { ProjectTypeId, DetectedProject, WorkflowCommands } from "../project-types/types.js";
import type { ToolId, ToolAdapterContext, GeneratedFile, SkillContent } from "../tool-adapters/types.js";
import { getProjectAdapter, detectProjectType } from "../project-types/index.js";
import { getToolAdapter } from "../tool-adapters/index.js";
import { buildAgentsMd } from "./agents-md-builder.js";
import { generateSkillCreatorFiles } from "../toolpacks/skill-creator.js";
import { generateToolpackSetupGuide, getToolpack } from "../toolpacks/registry.js";
import { generateDocsDirectory, generateDocsConstraintRule } from "../docs-scaffold/generator.js";
import { generateSkillExtractionGuide } from "../skill-extraction/generator.js";

export interface ResolveOptions {
  cwd: string;
  projectName: string;
  projectType?: ProjectTypeId;
  tools: ToolId[];
  extraRules?: string[];
  toolpacks?: string[];
  skipDocs?: boolean;
}

export interface ResolvedPlan {
  project: DetectedProject;
  tools: ToolId[];
  commands: WorkflowCommands;
  verificationChecks: string[];
  customRules: string[];
  skills: string[];
  files: GeneratedFile[];
}

export function resolve(opts: ResolveOptions): ResolvedPlan {
  const project = opts.projectType
    ? getProjectAdapter(opts.projectType).detect(opts.cwd) ?? {
        type: opts.projectType,
        language: "unknown",
        signals: [],
      }
    : detectProjectType(opts.cwd);

  const adapter = getProjectAdapter(project.type);
  const commands = adapter.defaultCommands(project);
  const verificationChecks = adapter.defaultVerificationChecks();
  const customRules = [
    ...adapter.defaultCustomRules(),
    ...(opts.extraRules ?? []),
  ];
  const skills = getDefaultSkills(project.type);
  const agentsMdContent = buildAgentsMd({
    projectName: opts.projectName,
    project,
    commands,
    verificationChecks,
    customRules,
    skills,
  });

  const files: GeneratedFile[] = [];

  files.push({
    path: "AGENTS.md",
    content: agentsMdContent,
    description: "Cross-tool AI agent instructions",
  });

  const skillContents = getSkillContents(project.type);

  const ctx: ToolAdapterContext = {
    projectName: opts.projectName,
    project,
    agentsMdContent,
    commands,
    verificationChecks,
    customRules,
    skills,
    skillContents,
  };

  for (const toolId of opts.tools) {
    const toolAdapter = getToolAdapter(toolId);
    files.push(...toolAdapter.generate(ctx));
  }

  files.push(...generateHarnessFiles(opts, project, commands, verificationChecks, customRules));
  files.push(...generateSkillFiles(project.type));

  files.push(...generateSkillCreatorFiles());

  files.push(...generateSkillExtractionGuide(opts.projectName, project));

  if (!opts.skipDocs) {
    files.push(...generateDocsDirectory(opts.projectName, project.type));
    files.push(generateDocsConstraintRule(opts.projectName));
  }

  const selectedPacks = opts.toolpacks ?? [];
  if (selectedPacks.length > 0) {
    files.push(generateToolpackSetupGuide(selectedPacks, opts.tools));
    for (const packId of selectedPacks) {
      const pack = getToolpack(packId);
      if (pack) {
        files.push(...pack.generateFiles(opts.tools, opts.projectName));
      }
    }
  }

  return { project, tools: opts.tools, commands, verificationChecks, customRules, skills, files };
}

function getDefaultSkills(projectType: ProjectTypeId): string[] {
  const map: Record<ProjectTypeId, string[]> = {
    frontend: ["frontend-conventions"],
    backend: ["api-conventions"],
    fullstack: ["fullstack-workflow"],
    monorepo: ["monorepo-discipline"],
    docs: ["docs-quality"],
  };
  return map[projectType] ?? [];
}

function generateHarnessFiles(
  opts: ResolveOptions,
  project: DetectedProject,
  commands: WorkflowCommands,
  checks: string[],
  rules: string[],
): GeneratedFile[] {
  const config = [
    `project:`,
    `  name: "${opts.projectName}"`,
    `  type: ${project.type}`,
    `  language: ${project.language}`,
    project.framework ? `  framework: ${project.framework}` : null,
    ``,
    `tools:`,
    ...opts.tools.map((t) => `  - ${t}`),
    ``,
    `workflows:`,
    `  commands:`,
    ...Object.entries(commands).map(([k, v]) => `    ${k}: "${v}"`),
    `  verification:`,
    `    checks: [${checks.map((c) => `"${c}"`).join(", ")}]`,
    ``,
    `custom_rules:`,
    ...rules.map((r) => `  - "${r}"`),
  ]
    .filter((line) => line !== null)
    .join("\n");

  return [
    {
      path: ".harness/config.yaml",
      content: config + "\n",
      description: "Harness scaffold configuration",
    },
  ];
}

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

function getSkillContents(projectType: ProjectTypeId): SkillContent[] {
  const skill = SKILL_MAP[projectType];
  if (!skill) return [];
  return [{ name: skill.name, description: skill.description, body: skill.content }];
}

function generateSkillFiles(projectType: ProjectTypeId): GeneratedFile[] {
  const skill = SKILL_MAP[projectType];
  if (!skill) return [];

  const skillMd = `---\nname: ${skill.name}\ndescription: ${skill.description}\n---\n\n${skill.content}\n`;

  return [
    {
      path: `.harness/skills/${skill.name}/SKILL.md`,
      content: skillMd,
      description: `Preset skill (source): ${skill.name}`,
    },
  ];
}
