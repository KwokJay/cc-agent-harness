import type { ProjectTypeId, DetectedProject, WorkflowCommands } from "../project-types/types.js";
import type { ToolId, ToolAdapterContext, GeneratedFile } from "../tool-adapters/types.js";
import { getProjectAdapter, detectProjectType } from "../project-types/index.js";
import { getToolAdapter } from "../tool-adapters/index.js";
import { buildAgentsMd } from "./agents-md-builder.js";

export interface ResolveOptions {
  cwd: string;
  projectName: string;
  projectType?: ProjectTypeId;
  tools: ToolId[];
  extraRules?: string[];
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

  const ctx: ToolAdapterContext = {
    projectName: opts.projectName,
    project,
    agentsMdContent,
    commands,
    verificationChecks,
    customRules,
    skills,
  };

  for (const toolId of opts.tools) {
    const toolAdapter = getToolAdapter(toolId);
    files.push(...toolAdapter.generate(ctx));
  }

  files.push(...generateHarnessFiles(opts, project, commands, verificationChecks, customRules));
  files.push(...generateSkillFiles(project.type));

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

function generateSkillFiles(projectType: ProjectTypeId): GeneratedFile[] {
  const skillMap: Record<ProjectTypeId, { name: string; description: string; content: string }> = {
    frontend: {
      name: "frontend-conventions",
      description: "Frontend development conventions and component patterns",
      content: [
        "# Frontend Conventions",
        "",
        "- Use functional components with hooks.",
        "- Keep components small and focused on a single responsibility.",
        "- Co-locate tests with components.",
        "- Use CSS modules or utility classes; avoid inline styles.",
        "- Ensure all interactive elements are keyboard accessible.",
        "- Write meaningful alt text for images.",
      ].join("\n"),
    },
    backend: {
      name: "api-conventions",
      description: "API development conventions and error handling patterns",
      content: [
        "# API Conventions",
        "",
        "- Use consistent HTTP status codes and error response shapes.",
        "- Validate all input at the boundary layer.",
        "- Write docstrings or JSDoc for public functions.",
        "- Use structured logging with correlation IDs.",
        "- Keep route handlers thin; delegate to service modules.",
        "- Write integration tests for critical endpoints.",
      ].join("\n"),
    },
    fullstack: {
      name: "fullstack-workflow",
      description: "Fullstack project coordination and shared conventions",
      content: [
        "# Fullstack Workflow",
        "",
        "- Keep frontend and backend in clearly separated directories.",
        "- Share types or schemas between layers when possible.",
        "- Run both frontend and backend tests in CI.",
        "- Use API contracts to decouple frontend and backend work.",
        "- Prefer thin API routes that delegate to service logic.",
      ].join("\n"),
    },
    monorepo: {
      name: "monorepo-discipline",
      description: "Monorepo boundaries, dependency direction, and package hygiene",
      content: [
        "# Monorepo Discipline",
        "",
        "- Respect package boundaries; do not import across packages without explicit dependency.",
        "- Keep shared utilities in a dedicated package.",
        "- Run only affected tests and builds when possible.",
        "- Use workspace protocols for internal dependencies.",
        "- Document each package's purpose in its own README.",
      ].join("\n"),
    },
    docs: {
      name: "docs-quality",
      description: "Documentation quality standards and writing conventions",
      content: [
        "# Documentation Quality",
        "",
        "- Write in clear, concise language.",
        "- Use headings to create scannable structure.",
        "- Include code examples for technical concepts.",
        "- Keep sentences short; avoid jargon without explanation.",
        "- Proofread for grammar and consistency before publishing.",
      ].join("\n"),
    },
  };

  const skill = skillMap[projectType];
  if (!skill) return [];

  const skillMd = [
    `---`,
    `name: ${skill.name}`,
    `description: ${skill.description}`,
    `---`,
    ``,
    skill.content,
    ``,
  ].join("\n");

  return [
    {
      path: `.harness/skills/${skill.name}/SKILL.md`,
      content: skillMd,
      description: `Preset skill: ${skill.name}`,
    },
  ];
}
