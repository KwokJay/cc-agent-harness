import { z } from "zod";
import type { ProjectTypeId } from "../project-types/types.js";
import type { ToolId } from "../tool-adapters/types.js";
import { ALL_PROJECT_TYPE_IDS } from "../project-types/index.js";
import { ALL_TOOL_IDS } from "../tool-adapters/index.js";

// ---------------------------------------------------------------------------
// Zod schemas — input-level (optional fields match YAML parsing semantics)
// ---------------------------------------------------------------------------

const ProjectSchema = z.object({
  name: z.string({ message: "'project.name' must be a non-empty string" })
    .min(1, { message: "'project.name' must be a non-empty string" }),
  type: z.string({ message: "'project.type' must be a string" })
    .refine(
      (val: string): val is ProjectTypeId => ALL_PROJECT_TYPE_IDS.includes(val as ProjectTypeId),
      { message: `'project.type' must be one of: ${ALL_PROJECT_TYPE_IDS.join(", ")}` },
    ),
  language: z.string({ message: "'project.language' must be a string" }),
  framework: z.string({ message: "'project.framework' must be a string if provided" }).optional(),
});

const ToolIdSchema = z.string().refine(
  (val: string): val is ToolId => ALL_TOOL_IDS.includes(val as ToolId),
  { message: `Unknown tool. Valid: ${ALL_TOOL_IDS.join(", ")}` },
);

const ApprovedExceptionSchema = z.object({
  id: z.string({ message: "must be a string" })
    .refine((val: string) => val.trim().length > 0, { message: "must be a non-empty string" }),
  description: z.string({ message: "must be a string if provided" }).optional(),
  target: z.string({ message: "must be a string if provided" }).optional(),
});

/**
 * Zod schema for raw YAML input.
 *
 * `workflows` and its nested fields are optional at the input level to
 * mirror the original permissive parsing: missing `workflows` is not an
 * error — the output config simply receives empty defaults.
 */
const HarnessConfigInputSchema = z.object({
  project: ProjectSchema,
  tools: z.array(ToolIdSchema, { message: "'tools' must be an array" }),
  workflows: z.object({
    commands: z.record(z.string(), z.string(), { message: "'workflows.commands' must be an object" }).optional(),
    verification: z.object({
      checks: z.array(z.string(), { message: "'workflows.verification.checks' must be an array" }).optional(),
    }, { message: "'workflows.verification' must be an object" }).optional(),
  }, { message: "'workflows' must be an object if provided" }).optional(),
  custom_rules: z.array(z.string(), { message: "'custom_rules' must be an array if provided" }).optional(),
  toolpacks: z.array(z.string(), { message: "'toolpacks' must be an array if provided" }).optional(),
  skip_docs: z.boolean({ message: "'skip_docs' must be a boolean if provided" }).optional(),
  generated_files: z.array(z.string(), { message: "'generated_files' must be an array if provided" }).optional(),
  aggregation: z.object({
    org: z.string({ message: "'aggregation.org' must be a string if provided" }).optional(),
    repo_slug: z.string({ message: "'aggregation.repo_slug' must be a string if provided" }).optional(),
  }, { message: "'aggregation' must be an object if provided" }).optional(),
  approved_exceptions: z.array(ApprovedExceptionSchema, { message: "'approved_exceptions' must be an array if provided" }).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Validated config — `workflows` is always present with defaults.
 *
 * We manually define this type (instead of z.infer) so that `workflows`
 * and its nested fields are non-optional in the output, matching the
 * original HarnessConfig interface consumers rely on.
 */
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
  custom_rules?: string[];
  toolpacks?: string[];
  skip_docs?: boolean;
  generated_files?: string[];
  aggregation?: {
    org?: string;
    repo_slug?: string;
  };
  approved_exceptions?: Array<{
    id: string;
    description?: string;
    target?: string;
  }>;
}

export interface ValidationResult {
  valid: boolean;
  config?: HarnessConfig;
  errors: string[];
}

// ---------------------------------------------------------------------------
// validateConfig — Zod-backed implementation with backward-compatible messages
// ---------------------------------------------------------------------------

export function validateConfig(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { valid: false, errors: ["Config must be a YAML object"] };
  }

  const errors: string[] = [];
  const obj = raw as Record<string, unknown>;

  // -- project --
  const project = obj.project;
  if (!project || typeof project !== "object" || Array.isArray(project)) {
    errors.push("Missing or invalid 'project' section");
  }

  // -- tools (check for non-string items before Zod, for exact message match) --
  const tools = obj.tools;
  if (Array.isArray(tools)) {
    for (const tool of tools) {
      if (typeof tool !== "string") {
        errors.push(`'tools' contains non-string value: ${JSON.stringify(tool)}`);
      }
    }
  }

  // -- approved_exceptions structural pre-check --
  if (obj.approved_exceptions !== undefined && Array.isArray(obj.approved_exceptions)) {
    const arr = obj.approved_exceptions as unknown[];
    for (let i = 0; i < arr.length; i++) {
      const row = arr[i];
      if (typeof row !== "object" || row === null || Array.isArray(row)) {
        errors.push(`'approved_exceptions[${i}]' must be an object`);
      }
    }
  }

  // Run Zod safeParse for full structural + type validation
  const result = HarnessConfigInputSchema.safeParse(raw);

  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      const msg = mapIssueToMessage(path, issue, obj);
      // Avoid duplicates with pre-validation errors
      if (!errors.some((e) => e === msg)) {
        errors.push(msg);
      }
    }
  }

  if (errors.length > 0 || !result.success) {
    return { valid: false, errors: errors.length > 0 ? errors : ["Validation failed"] };
  }

  // Build the output config from Zod-parsed data, filling in defaults
  // for optional fields exactly as the original implementation did.
  const parsed = result.data;

  const config: HarnessConfig = {
    project: parsed.project,
    tools: parsed.tools,
    workflows: {
      commands: parsed.workflows?.commands ?? {},
      verification: { checks: parsed.workflows?.verification?.checks ?? [] },
    },
    ...(obj.custom_rules !== undefined ? { custom_rules: parsed.custom_rules } : {}),
    ...(obj.toolpacks !== undefined ? { toolpacks: parsed.toolpacks } : {}),
    ...(obj.skip_docs !== undefined ? { skip_docs: parsed.skip_docs } : {}),
    ...(obj.generated_files !== undefined ? { generated_files: parsed.generated_files } : {}),
    ...(parsed.aggregation !== undefined
      ? {
          aggregation: {
            ...(parsed.aggregation.org !== undefined ? { org: parsed.aggregation.org } : {}),
            ...(parsed.aggregation.repo_slug !== undefined ? { repo_slug: parsed.aggregation.repo_slug } : {}),
          },
        }
      : {}),
    ...(parsed.approved_exceptions !== undefined
      ? { approved_exceptions: parsed.approved_exceptions }
      : {}),
  };

  return { valid: true, config, errors: [] };
}

// ---------------------------------------------------------------------------
// Error message mapping — backward-compatible with original hand-written messages
// ---------------------------------------------------------------------------

function mapIssueToMessage(
  path: string,
  issue: z.ZodIssue,
  rawObj: Record<string, unknown>,
): string {
  // project section
  if (path === "project" && issue.code === "invalid_type") {
    return "Missing or invalid 'project' section";
  }
  if (path === "project.name") {
    return issue.message || "'project.name' must be a non-empty string";
  }
  if (path === "project.type") {
    if (issue.code === "invalid_type") return "'project.type' must be a string";
    const p = rawObj.project as Record<string, unknown> | undefined;
    return `'project.type' must be one of: ${ALL_PROJECT_TYPE_IDS.join(", ")} (got "${p?.type}")`;
  }
  if (path === "project.language") {
    return "'project.language' must be a string";
  }
  if (path === "project.framework") {
    return "'project.framework' must be a string if provided";
  }

  // tools
  if (path === "tools") {
    if (issue.code === "invalid_type") return "'tools' must be an array";
    return issue.message;
  }
  if (path.startsWith("tools.")) {
    const index = issue.path[1];
    const tools = rawObj.tools;
    if (Array.isArray(tools) && typeof tools[index as number] === "string") {
      const toolVal = tools[index as number];
      return `Unknown tool '${toolVal}'. Valid: ${ALL_TOOL_IDS.join(", ")}`;
    }
    return issue.message;
  }

  // workflows
  if (path === "workflows") {
    return "'workflows' must be an object if provided";
  }
  if (path === "workflows.commands") {
    return "'workflows.commands' must be an object";
  }
  if (path === "workflows.verification") {
    return "'workflows.verification' must be an object";
  }
  if (path === "workflows.verification.checks") {
    return "'workflows.verification.checks' must be an array";
  }

  // optional top-level fields
  if (path === "custom_rules") return "'custom_rules' must be an array if provided";
  if (path === "toolpacks") return "'toolpacks' must be an array if provided";
  if (path === "skip_docs") return "'skip_docs' must be a boolean if provided";
  if (path === "generated_files") return "'generated_files' must be an array if provided";

  // aggregation
  if (path === "aggregation") return "'aggregation' must be an object if provided";
  if (path === "aggregation.org") return "'aggregation.org' must be a string if provided";
  if (path === "aggregation.repo_slug") return "'aggregation.repo_slug' must be a string if provided";

  // approved_exceptions
  if (path === "approved_exceptions") return "'approved_exceptions' must be an array if provided";
  if (path.startsWith("approved_exceptions.")) {
    return rewriteApprovedExceptionMessage(path, issue);
  }

  return issue.message;
}

function rewriteApprovedExceptionMessage(path: string, issue: z.ZodIssue): string {
  const match = path.match(/^approved_exceptions\.(\d+)(?:\.(.*))?$/);
  if (!match) return issue.message;
  const [, index, field] = match;
  if (!field) {
    return `'approved_exceptions[${index}]' must be an object`;
  }
  if (field === "id") {
    return `'approved_exceptions[${index}].id' must be a non-empty string`;
  }
  return `'approved_exceptions[${index}].${field}' must be a string if provided`;
}

// Export the schema for external use / advanced composition
export { HarnessConfigInputSchema as HarnessConfigSchema };
