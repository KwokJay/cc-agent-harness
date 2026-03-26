import type { DetectedProject, WorkflowCommands } from "../project-types/types.js";
import { getDocsConstraintParagraph } from "../docs-scaffold/generator.js";
import { getChangelogConstraintParagraph } from "../changelog/generator.js";
import { render, type TemplateContext } from "../template/engine.js";
import { AGENTS_MD_TEMPLATE } from "../templates/agents-md.js";
import { buildVerificationStepsFromWorkflows } from "../workflows/verification-copy.js";

export interface AgentsMdOptions {
  projectName: string;
  project: DetectedProject;
  commands: WorkflowCommands;
  verificationChecks: string[];
  customRules: string[];
  skills: string[];
  /** When true, link to `.harness/workflows/*` (default: true). */
  includeWorkflowGuides?: boolean;
  /** When true, include memory-layer placeholder (default: true). */
  includeMemoryGuide?: boolean;
}

export function buildAgentsMd(opts: AgentsMdOptions): string {
  const commandEntries = Object.entries(opts.commands).map(([name, cmd]) => ({
    name,
    cmd,
  }));

  const verificationSteps = buildVerificationStepsFromWorkflows(opts.commands, opts.verificationChecks);

  const context: TemplateContext = {
    projectName: opts.projectName,
    project: {
      type: opts.project.type,
      language: opts.project.language,
      framework: opts.project.framework,
    },
    hasCustomRules: opts.customRules.length > 0,
    customRules: opts.customRules,
    hasCommands: commandEntries.length > 0,
    commandEntries: commandEntries as unknown as TemplateContext[],
    hasVerification: opts.verificationChecks.length > 0,
    verificationSteps,
    docsConstraint: getDocsConstraintParagraph(),
    changelogConstraint: getChangelogConstraintParagraph(),
    hasSkills: opts.skills.length > 0,
    skills: opts.skills,
    hasWorkflowGuides: opts.includeWorkflowGuides !== false,
    hasMemoryGuide: opts.includeMemoryGuide !== false,
  };

  return render(AGENTS_MD_TEMPLATE, context);
}
