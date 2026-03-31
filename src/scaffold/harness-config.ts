import type { ProjectTypeId, DetectedProject, WorkflowCommands } from "../project-types/types.js";
import type { ToolId, GeneratedFile } from "../tool-adapters/types.js";
import { stringify as yamlStringify } from "yaml";

export interface HarnessConfigOptions {
  projectName: string;
  projectType: ProjectTypeId;
  project: DetectedProject;
  tools: ToolId[];
  commands: WorkflowCommands;
  checks: string[];
  rules: string[];
  toolpacks?: string[];
  skipDocs?: boolean;
}

export function generateHarnessFiles(
  opts: HarnessConfigOptions,
): GeneratedFile[] {
  const configObj: Record<string, unknown> = {
    project: {
      name: opts.projectName,
      type: opts.project.type,
      language: opts.project.language,
      ...(opts.project.framework ? { framework: opts.project.framework } : {}),
    },
    tools: opts.tools,
    workflows: {
      commands: opts.commands,
      verification: { checks: opts.checks },
    },
    custom_rules: opts.rules,
  };

  const selectedPacks = opts.toolpacks ?? [];
  if (selectedPacks.length > 0) {
    configObj.toolpacks = selectedPacks;
  }

  if (opts.skipDocs) {
    configObj.skip_docs = true;
  }

  return [
    {
      path: ".harness/config.yaml",
      content: yamlStringify(configObj),
      description: "Harness scaffold configuration",
      source: "harness-config" as const,
    },
  ];
}
