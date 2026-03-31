export type { ProjectTypeAdapter, ProjectTypeId, DetectedProject, SubProject, WorkflowCommands } from "./project-types/index.js";
export { getProjectAdapter, detectProjectType, ALL_PROJECT_TYPE_IDS } from "./project-types/index.js";
export { scanWorkspace, getWorkspacePackageDirs } from "./project-types/scanner.js";

export type {
  ToolAdapter,
  ToolId,
  ToolAdapterContext,
  GeneratedFile,
  ToolCapability,
  SupportTier,
} from "./tool-adapters/index.js";
export { getToolAdapter, listToolAdapters, ALL_TOOL_IDS, TOOL_CAPABILITIES, getToolCapability } from "./tool-adapters/index.js";

export { resolve as resolveScaffold, type ResolveOptions, type ResolvedPlan } from "./scaffold/resolver.js";
export { generateFiles, type GenerateResult, type GenerateOptions } from "./scaffold/generator.js";
export { diffPlan, type DiffResult } from "./scaffold/differ.js";
export { parseSkillFile, serializeSkill, hashBody, type ParsedSkill, type SkillSource } from "./skill-extraction/parser.js";
export { mergeSkill, type MergeStrategy, type MergeDecision } from "./skill-extraction/merger.js";
export { validateConfig, HarnessConfigSchema, type HarnessConfig, type ValidationResult } from "./config/schema.js";
export { loadHarnessConfig } from "./config/load-harness-config.js";
export {
  runVerify,
  readLastVerifyState,
  daysSinceLastVerify,
  getStaleVerifyDays,
  type VerifyOptions,
  type LastVerifyState,
} from "./cli/verify.js";
export {
  buildVerificationSteps,
  buildVerificationStepsFromWorkflows,
  buildVerificationCheckLines,
} from "./workflows/verification-copy.js";
export { mergeCursorMcpFromDisk, readCursorMcpFile, stringifyCursorMcp } from "./mcp/cursor-mcp.js";
export { getHarnessVersion } from "./cli/harness-version.js";
export {
  buildManifest,
  writeManifestFile,
  refreshHarnessManifest,
  getHarnessManifestPath,
  HARNESS_MANIFEST_VERSION,
  type HarnessManifest,
  type HarnessManifestAdoption,
  type HarnessManifestHealth,
  type HarnessManifestAggregation,
  type HarnessManifestApprovedException,
  type BuildManifestResult,
} from "./manifest/index.js";
export { discoverToolpacks } from "./toolpacks/discovery.js";
export {
  type ToolpackPlugin,
  type ToolpackInstallMethod,
  type ToolpackProvenance,
} from "./toolpacks/plugin.js";
export {
  OFFICIAL_TOOLPACK_IDS,
  getOfficialToolpackCatalog,
  resolveToolpackProvenance,
  isOfficialToolpackId,
  type OfficialToolpackCatalogEntry,
  type OfficialToolpackId,
} from "./toolpacks/official.js";
export { buildAgentsMd, type AgentsMdOptions } from "./scaffold/agents-md-builder.js";

export { render, type TemplateContext } from "./template/engine.js";

export { getAllToolpacks, getOptionalToolpacks, getToolpack, clearToolpackCache, type Toolpack, type ToolpackCategory } from "./toolpacks/registry.js";
export { generateSkillCreatorFiles } from "./toolpacks/skill-creator.js";
export { generateDocsDirectory, generateDocsConstraintRule } from "./docs-scaffold/generator.js";
export { generateSkillExtractionGuide } from "./skill-extraction/generator.js";
export {
  analyzeProject,
  analyzeAndExtractSkills,
  type AnalyzeProjectOptions,
  type ExtractedSkill,
  type AnalysisResult,
} from "./skill-extraction/analyzer.js";
export { generateChangelog, getChangelogConstraintParagraph } from "./changelog/generator.js";
