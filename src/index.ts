export type { ProjectTypeAdapter, ProjectTypeId, DetectedProject, WorkflowCommands } from "./project-types/index.js";
export { getProjectAdapter, detectProjectType, ALL_PROJECT_TYPE_IDS } from "./project-types/index.js";

export type { ToolAdapter, ToolId, ToolAdapterContext, GeneratedFile } from "./tool-adapters/index.js";
export { getToolAdapter, listToolAdapters, ALL_TOOL_IDS } from "./tool-adapters/index.js";

export { resolve as resolveScaffold, type ResolveOptions, type ResolvedPlan } from "./scaffold/resolver.js";
export { generateFiles, type GenerateResult } from "./scaffold/generator.js";
export { buildAgentsMd, type AgentsMdOptions } from "./scaffold/agents-md-builder.js";

export { render, type TemplateContext } from "./template/engine.js";

export { getAllToolpacks, getOptionalToolpacks, getToolpack, type Toolpack, type ToolpackCategory } from "./toolpacks/registry.js";
export { generateSkillCreatorFiles } from "./toolpacks/skill-creator.js";
export { generateDocsDirectory, generateDocsConstraintRule } from "./docs-scaffold/generator.js";
export { generateSkillExtractionGuide } from "./skill-extraction/generator.js";
export { analyzeAndExtractSkills, type ExtractedSkill } from "./skill-extraction/analyzer.js";
export { generateChangelog, getChangelogConstraintParagraph } from "./changelog/generator.js";
