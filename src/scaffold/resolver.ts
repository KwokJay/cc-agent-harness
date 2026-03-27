import type {
  ProjectTypeId,
  DetectedProject,
  WorkflowCommands,
} from "../project-types/types.js";
import type { ToolId, ToolAdapterContext, GeneratedFile, SkillContent } from "../tool-adapters/types.js";
import { getProjectAdapter, detectProjectType } from "../project-types/index.js";
import { getToolAdapter } from "../tool-adapters/index.js";
import { buildAgentsMd } from "./agents-md-builder.js";
import { generateSkillCreatorFiles } from "../toolpacks/skill-creator.js";
import { generateToolpackSetupGuide, getToolpack } from "../toolpacks/registry.js";
import { generateDocsDirectory, generateDocsConstraintRule } from "../docs-scaffold/generator.js";
import { generateSkillExtractionGuide } from "../skill-extraction/generator.js";
import { analyzeProject } from "../skill-extraction/analyzer.js";
import { generateChangelog } from "../changelog/generator.js";
import { stringify as yamlStringify } from "yaml";
import { buildRalphLoopMarkdown } from "../templates/workflows/ralph-loop.js";
import { buildMultiAgentPatternsMarkdown } from "../templates/workflows/multi-agent-patterns.js";
import { buildRecommendedToolsMarkdown } from "./recommended-tools.js";
import { getHarnessVersion } from "../cli/harness-version.js";

export interface ResolveOptions {
  cwd: string;
  projectName: string;
  projectType?: ProjectTypeId;
  tools: ToolId[];
  extraRules?: string[];
  toolpacks?: string[];
  skipDocs?: boolean;
  /** Override adapter-default workflow commands (e.g. from config.yaml on `harn update`). */
  commands?: WorkflowCommands;
  /** Override adapter-default verification checks (e.g. from config.yaml on `harn update`). */
  verificationChecks?: string[];
  /**
   * When set (e.g. `harn update` with `custom_rules` in YAML), replaces adapter+extraRules merge.
   * When unset (`harn init`), uses `adapter.defaultCustomRules()` + `extraRules`.
   */
  customRulesFromConfig?: string[];
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
  const commands =
    opts.commands != null && Object.keys(opts.commands).length > 0
      ? opts.commands
      : adapter.defaultCommands(project);
  const verificationChecks =
    opts.verificationChecks != null && opts.verificationChecks.length > 0
      ? opts.verificationChecks
      : adapter.defaultVerificationChecks();
  const customRules =
    opts.customRulesFromConfig !== undefined
      ? [...opts.customRulesFromConfig]
      : [...adapter.defaultCustomRules(), ...(opts.extraRules ?? [])];
  const presetSkills = getDefaultSkills(project.type);
  const selectedPacks = opts.toolpacks ?? [];
  const resolvedPacksForDocs = selectedPacks
    .map((id) => getToolpack(id, opts.cwd))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const analysis = analyzeProject(opts.cwd, project, opts.projectName);
  const extractedSkillNames = analysis.skills.map((s) => s.name);
  const skills = [...presetSkills, ...extractedSkillNames];

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

  files.push(...analysis.files);

  const presetSkillContents = getSkillContents(project.type);
  const extractedSkillContents: SkillContent[] = analysis.skills.map((s) => ({
    name: s.name,
    description: s.description,
    body: s.body,
  }));

  const allSkillContents = [...presetSkillContents, ...extractedSkillContents];

  const ctx: ToolAdapterContext = {
    projectName: opts.projectName,
    project,
    agentsMdContent,
    commands,
    verificationChecks,
    customRules,
    skills,
    skillContents: allSkillContents,
  };

  for (const toolId of opts.tools) {
    const toolAdapter = getToolAdapter(toolId);
    files.push(...toolAdapter.generate(ctx));
  }

  files.push(...generateHarnessFiles(opts, project, commands, verificationChecks, customRules));

  files.push(
    {
      path: ".harness/workflows/ralph-loop.md",
      content: buildRalphLoopMarkdown(opts.projectName, commands, verificationChecks),
      description: "Ralph-style verify loop (documentation)",
    },
    {
      path: ".harness/workflows/multi-agent-patterns.md",
      content: buildMultiAgentPatternsMarkdown(opts.projectName),
      description: "Multi-agent role patterns (documentation)",
    },
    {
      path: ".harness/recommended-tools.md",
      content: buildRecommendedToolsMarkdown(opts.projectName, opts.tools, resolvedPacksForDocs),
      description: "Static recommended tools and paste targets",
    },
    {
      path: ".harness/state/harness-version.txt",
      content: `${getHarnessVersion()}\n`,
      description: "Harness package version at last init/update",
    },
  );

  files.push(...generateSkillFiles(project.type));

  files.push(...generateSkillCreatorFiles());

  files.push(...generateSkillExtractionGuide(opts.projectName, project));

  files.push(...generateChangelog(opts.cwd, opts.projectName));

  if (!opts.skipDocs) {
    files.push(...generateDocsDirectory(opts.projectName, project.type));
    files.push(generateDocsConstraintRule(opts.projectName));
  }

  if (selectedPacks.length > 0) {
    files.push(generateToolpackSetupGuide(selectedPacks, opts.tools, opts.cwd));
    for (const packId of selectedPacks) {
      const pack = getToolpack(packId, opts.cwd);
      if (pack) {
        files.push(...pack.generateFiles(opts.tools, opts.projectName, opts.cwd));
      }
    }
  }

  const allPaths = files.map((f) => f.path);
  const configIdx = files.findIndex((f) => f.path === ".harness/config.yaml");
  if (configIdx !== -1) {
    const existingConfig = files[configIdx].content;
    const pathsList = yamlStringify({ generated_files: allPaths });
    files[configIdx] = {
      ...files[configIdx],
      content: existingConfig + "\n" + pathsList,
    };
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
  const configObj: Record<string, unknown> = {
    project: {
      name: opts.projectName,
      type: project.type,
      language: project.language,
      ...(project.framework ? { framework: project.framework } : {}),
    },
    tools: opts.tools,
    workflows: {
      commands,
      verification: { checks },
    },
    custom_rules: rules,
  };

  const selectedPacks = opts.toolpacks ?? [];
  if (selectedPacks.length > 0) {
    configObj.toolpacks = selectedPacks;
  }

  if (opts.skipDocs) {
    configObj.skip_docs = true;
  }

  return [
    {
      path: ".harness/config.yaml",
      content: yamlStringify(configObj),
      description: "Harness scaffold configuration",
      source: "harness-config" as const,
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
      harnessSkillSource: "preset",
    },
  ];
}
