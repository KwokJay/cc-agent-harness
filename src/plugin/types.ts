import type { ProjectAdapter, HealthCheck } from "../adapter/interface.js";
import type { HookHandler } from "../hook/types.js";
import type { FeatureSpec } from "../feature/types.js";
import type { AgentDefinition } from "../config/schema.js";

export interface HarnessPlugin {
  name: string;
  version?: string;
  description?: string;

  adapters?: ProjectAdapter[];
  agents?: AgentDefinition[];
  hooks?: HookHandler[];
  healthChecks?: HealthCheck[];
  features?: FeatureSpec[];
  skillDirectories?: string[];
}
