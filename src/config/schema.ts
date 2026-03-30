import type { ProjectTypeId } from "../project-types/types.js";
import type { ToolId } from "../tool-adapters/types.js";
import { ALL_PROJECT_TYPE_IDS } from "../project-types/index.js";
import { ALL_TOOL_IDS } from "../tool-adapters/types.js";

export interface HarnessConfig {
  project: {
    name: string;
    type: ProjectTypeId;
    language: string;
    framework?: string;
  };
  tools: ToolId[];
  workflows: {
    commands: Record<string, string>;
    verification: { checks: string[] };
  };
  /** When absent in YAML, treated as "use resolver defaults" on init/update. */
  custom_rules?: string[];
  toolpacks?: string[];
  skip_docs?: boolean;
  generated_files?: string[];
  /**
   * Optional org/repo identity for aggregating manifests across repositories (Phase 6).
   */
  aggregation?: {
    org?: string;
    repo_slug?: string;
  };
  /**
   * Approved, machine-readable exceptions (e.g. drift/verify scope) for aggregation consumers.
   */
  approved_exceptions?: Array<{
    id: string;
    description?: string;
    /** Optional path or glob hint for what this exception applies to. */
    target?: string;
  }>;
}

export interface ValidationResult {
  valid: boolean;
  config?: HarnessConfig;
  errors: string[];
}

export function validateConfig(raw: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { valid: false, errors: ["Config must be a YAML object"] };
  }

  const obj = raw as Record<string, unknown>;

  const project = obj.project;
  if (!project || typeof project !== "object" || Array.isArray(project)) {
    errors.push("Missing or invalid 'project' section");
  } else {
    const p = project as Record<string, unknown>;
    if (typeof p.name !== "string" || !p.name) {
      errors.push("'project.name' must be a non-empty string");
    }
    if (typeof p.type !== "string") {
      errors.push("'project.type' must be a string");
    } else if (!ALL_PROJECT_TYPE_IDS.includes(p.type as ProjectTypeId)) {
      errors.push(`'project.type' must be one of: ${ALL_PROJECT_TYPE_IDS.join(", ")} (got "${p.type}")`);
    }
    if (typeof p.language !== "string") {
      errors.push("'project.language' must be a string");
    }
    if (p.framework !== undefined && typeof p.framework !== "string") {
      errors.push("'project.framework' must be a string if provided");
    }
  }

  const tools = obj.tools;
  if (!Array.isArray(tools)) {
    errors.push("'tools' must be an array");
  } else {
    for (const tool of tools) {
      if (typeof tool !== "string") {
        errors.push(`'tools' contains non-string value: ${JSON.stringify(tool)}`);
      } else if (!ALL_TOOL_IDS.includes(tool as ToolId)) {
        errors.push(`Unknown tool '${tool}'. Valid: ${ALL_TOOL_IDS.join(", ")}`);
      }
    }
  }

  const workflows = obj.workflows;
  if (workflows !== undefined) {
    if (typeof workflows !== "object" || Array.isArray(workflows)) {
      errors.push("'workflows' must be an object if provided");
    } else {
      const w = workflows as Record<string, unknown>;
      if (w.commands !== undefined && (typeof w.commands !== "object" || Array.isArray(w.commands))) {
        errors.push("'workflows.commands' must be an object");
      }
      if (w.verification !== undefined) {
        if (typeof w.verification !== "object" || Array.isArray(w.verification)) {
          errors.push("'workflows.verification' must be an object");
        } else {
          const v = w.verification as Record<string, unknown>;
          if (v.checks !== undefined && !Array.isArray(v.checks)) {
            errors.push("'workflows.verification.checks' must be an array");
          }
        }
      }
    }
  }

  if (obj.custom_rules !== undefined && !Array.isArray(obj.custom_rules)) {
    errors.push("'custom_rules' must be an array if provided");
  }

  if (obj.toolpacks !== undefined && !Array.isArray(obj.toolpacks)) {
    errors.push("'toolpacks' must be an array if provided");
  }

  if (obj.skip_docs !== undefined && typeof obj.skip_docs !== "boolean") {
    errors.push("'skip_docs' must be a boolean if provided");
  }

  if (obj.generated_files !== undefined && !Array.isArray(obj.generated_files)) {
    errors.push("'generated_files' must be an array if provided");
  }

  if (obj.aggregation !== undefined) {
    if (typeof obj.aggregation !== "object" || obj.aggregation === null || Array.isArray(obj.aggregation)) {
      errors.push("'aggregation' must be an object if provided");
    } else {
      const agg = obj.aggregation as Record<string, unknown>;
      if (agg.org !== undefined && typeof agg.org !== "string") {
        errors.push("'aggregation.org' must be a string if provided");
      }
      if (agg.repo_slug !== undefined && typeof agg.repo_slug !== "string") {
        errors.push("'aggregation.repo_slug' must be a string if provided");
      }
    }
  }

  if (obj.approved_exceptions !== undefined) {
    if (!Array.isArray(obj.approved_exceptions)) {
      errors.push("'approved_exceptions' must be an array if provided");
    } else {
      for (let i = 0; i < obj.approved_exceptions.length; i++) {
        const row = obj.approved_exceptions[i];
        if (typeof row !== "object" || row === null || Array.isArray(row)) {
          errors.push(`'approved_exceptions[${i}]' must be an object`);
          continue;
        }
        const r = row as Record<string, unknown>;
        if (typeof r.id !== "string" || !r.id.trim()) {
          errors.push(`'approved_exceptions[${i}].id' must be a non-empty string`);
        }
        if (r.description !== undefined && typeof r.description !== "string") {
          errors.push(`'approved_exceptions[${i}].description' must be a string if provided`);
        }
        if (r.target !== undefined && typeof r.target !== "string") {
          errors.push(`'approved_exceptions[${i}].target' must be a string if provided`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const p = (project as Record<string, unknown>);
  const w = (workflows as Record<string, unknown> | undefined);
  const wv = w?.verification as Record<string, unknown> | undefined;

  const config: HarnessConfig = {
    project: {
      name: p.name as string,
      type: p.type as ProjectTypeId,
      language: p.language as string,
      framework: p.framework as string | undefined,
    },
    tools: tools as ToolId[],
    workflows: {
      commands: ((w?.commands as Record<string, string>) ?? {}),
      verification: { checks: ((wv?.checks as string[]) ?? []) },
    },
    ...(obj.custom_rules !== undefined ? { custom_rules: obj.custom_rules as string[] } : {}),
    toolpacks: obj.toolpacks as string[] | undefined,
    skip_docs: obj.skip_docs as boolean | undefined,
    generated_files: obj.generated_files as string[] | undefined,
    ...(obj.aggregation !== undefined && typeof obj.aggregation === "object" && !Array.isArray(obj.aggregation)
      ? {
          aggregation: {
            ...((obj.aggregation as Record<string, unknown>).org !== undefined
              ? { org: (obj.aggregation as { org: string }).org }
              : {}),
            ...((obj.aggregation as Record<string, unknown>).repo_slug !== undefined
              ? { repo_slug: (obj.aggregation as { repo_slug: string }).repo_slug }
              : {}),
          },
        }
      : {}),
    ...(Array.isArray(obj.approved_exceptions)
      ? {
          approved_exceptions: obj.approved_exceptions as HarnessConfig["approved_exceptions"],
        }
      : {}),
  };

  return { valid: true, config, errors: [] };
}
