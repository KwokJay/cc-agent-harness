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
import { getDefaultSkills } from "./default-skills.js";
import { getSkillContents, generateSkillFiles } from "./preset-skills.js";
import { generateHarnessFiles } from "./harness-config.js";

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
  /** Pin skill-extraction doc dates (used by drift detection to match on-disk files). */
  generatedDateOverride?: string;
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

  const analysis = analyzeProject(opts.cwd, project, opts.projectName, {
    generatedDate: opts.generatedDateOverride,
  });
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

  files.push(...generateHarnessFiles({
    projectName: opts.projectName,
    projectType: project.type,
    project,
    tools: opts.tools,
    commands,
    checks: verificationChecks,
    rules: customRules,
    toolpacks: opts.toolpacks,
    skipDocs: opts.skipDocs,
  }));

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
