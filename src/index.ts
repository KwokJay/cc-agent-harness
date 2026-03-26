export type { ProjectTypeAdapter, ProjectTypeId, DetectedProject, SubProject, WorkflowCommands } from "./project-types/index.js";
export { getProjectAdapter, detectProjectType, ALL_PROJECT_TYPE_IDS } from "./project-types/index.js";
export { scanWorkspace } from "./project-types/scanner.js";

export type { ToolAdapter, ToolId, ToolAdapterContext, GeneratedFile } from "./tool-adapters/index.js";
export { getToolAdapter, listToolAdapters, ALL_TOOL_IDS } from "./tool-adapters/index.js";

export { resolve as resolveScaffold, type ResolveOptions, type ResolvedPlan } from "./scaffold/resolver.js";
export { generateFiles, type GenerateResult, type GenerateOptions } from "./scaffold/generator.js";
export { diffPlan, type DiffResult } from "./scaffold/differ.js";
export { parseSkillFile, serializeSkill, hashBody, type ParsedSkill, type SkillSource } from "./skill-extraction/parser.js";
export { mergeSkill, type MergeStrategy, type MergeDecision } from "./skill-extraction/merger.js";
export { validateConfig, type HarnessConfig, type ValidationResult } from "./config/schema.js";
export { discoverToolpacks } from "./toolpacks/discovery.js";
export { type ToolpackPlugin, type ToolpackInstallMethod } from "./toolpacks/plugin.js";
export { buildAgentsMd, type AgentsMdOptions } from "./scaffold/agents-md-builder.js";

export { render, type TemplateContext } from "./template/engine.js";

export { getAllToolpacks, getOptionalToolpacks, getToolpack, type Toolpack, type ToolpackCategory } from "./toolpacks/registry.js";
export { generateSkillCreatorFiles } from "./toolpacks/skill-creator.js";
export { generateDocsDirectory, generateDocsConstraintRule } from "./docs-scaffold/generator.js";
export { generateSkillExtractionGuide } from "./skill-extraction/generator.js";
export { analyzeProject, analyzeAndExtractSkills, type ExtractedSkill, type AnalysisResult } from "./skill-extraction/analyzer.js";
export { generateChangelog, getChangelogConstraintParagraph } from "./changelog/generator.js";
