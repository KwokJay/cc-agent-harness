// Config
export {
  loadConfig,
  loadConfigWithLayers,
  configExists,
  type HarnessConfig,
  type ConfigLayer,
  type LoadConfigOptions,
  type LoadConfigResult,
} from "./config/loader.js";
export {
  harnessConfigSchema,
  agentDefinitionSchema,
  modelTierSchema,
  providerMappingSchema,
  agentsConfigSchema,
  skillsConfigSchema,
  verificationStageSchema,
  verificationConfigSchema,
  workflowsConfigSchema,
  templatesConfigSchema,
  projectConfigSchema,
  featuresConfigSchema,
  type AgentDefinition,
  type ModelTier,
} from "./config/schema.js";
export { BUILT_IN_AGENTS, DEFAULT_SKILL_DIRECTORIES, DEFAULT_VERIFICATION_CHECKS } from "./config/defaults.js";

// Agents
export { AgentRegistry } from "./agent/registry.js";
export { routeModel, inferComplexity, type TaskComplexity, type ModelRouting } from "./agent/router.js";

// Adapters
export { type ProjectAdapter, type CommandDefinition, type HealthCheck, type HealthCheckResult } from "./adapter/interface.js";
export { AdapterRegistry } from "./adapter/registry.js";
export { detectProjectType, detectLanguage } from "./adapter/detector.js";
export { TypeScriptAdapter } from "./adapter/typescript.js";
export { PythonAdapter } from "./adapter/python.js";
export { RustAdapter } from "./adapter/rust.js";

// Skills
export { discoverSkills, listSkillDirectories, type SkillInfo } from "./skill/manager.js";
export { validateSkill, type SkillValidationResult } from "./skill/validator.js";
export { scaffoldSkill, type ScaffoldOptions } from "./skill/scaffold.js";

// Health
export { runHealthChecks, formatReport, type HealthReport, type HealthReportEntry } from "./health/checker.js";

// Template
export { render, type TemplateContext } from "./template/engine.js";
export { renderFile, renderDirectory } from "./template/renderer.js";

// Audit
export { AuditLogger, type AuditEntry, type AuditEventKind } from "./audit/index.js";

// Context
export { ContextPipeline, type ContextBlock, type ContextPipelineResult, type ContextBuildOptions, type TagStyle } from "./context/index.js";

// Plugins
export { PluginRegistry, type HarnessPlugin } from "./plugin/index.js";

// Features
export { FeatureRegistry, type FeatureSpec, type FeatureStage } from "./feature/index.js";

// Hooks
export {
  discoverHooks,
  HookDispatcher,
  type HookEventName,
  type HookHandler,
  type HookPayload,
  type HookResult,
  type HooksConfig,
} from "./hook/index.js";
