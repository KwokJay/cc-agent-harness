import { z } from "zod";

export const modelTierSchema = z.enum(["haiku", "sonnet", "opus"]);

export const agentDefinitionSchema = z.object({
  name: z.string(),
  domain: z.string(),
  tier: modelTierSchema,
  description: z.string().optional(),
});

export const agentsConfigSchema = z.object({
  delegation_first: z.boolean().default(true),
  model_routing: z
    .object({
      low: modelTierSchema.default("haiku"),
      medium: modelTierSchema.default("sonnet"),
      high: modelTierSchema.default("opus"),
    })
    .default({}),
  definitions: z.array(agentDefinitionSchema).default([]),
});

export const skillsConfigSchema = z.object({
  directories: z.array(z.string()).default([".codex/skills", ".harness/skills"]),
  auto_detect: z.boolean().default(true),
});

export const verificationConfigSchema = z.object({
  checks: z.array(z.string()).default(["build", "test", "lint"]),
});

export const workflowsConfigSchema = z.object({
  commands: z.record(z.string(), z.string()).default({}),
  verification: verificationConfigSchema.default({}),
});

export const templatesConfigSchema = z.object({
  agents_md: z
    .object({
      variant: z.enum(["minimal", "standard", "full"]).default("standard"),
      custom_rules: z.array(z.string()).default([]),
    })
    .default({}),
});

export const projectConfigSchema = z.object({
  name: z.string(),
  language: z.enum(["rust", "typescript", "python", "multi"]).default("typescript"),
  description: z.string().default(""),
});

export const harnessConfigSchema = z.object({
  project: projectConfigSchema,
  agents: agentsConfigSchema.default({}),
  skills: skillsConfigSchema.default({}),
  workflows: workflowsConfigSchema.default({}),
  templates: templatesConfigSchema.default({}),
});

export type HarnessConfig = z.infer<typeof harnessConfigSchema>;
export type AgentDefinition = z.infer<typeof agentDefinitionSchema>;
export type ModelTier = z.infer<typeof modelTierSchema>;
