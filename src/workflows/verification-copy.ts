import type { HarnessConfig } from "../config/schema.js";
import type { WorkflowCommands } from "../project-types/types.js";

/**
 * Numbered markdown lines for AGENTS.md / ralph-loop — same semantics as `harn verify`
 * (each check maps to workflows.commands[check]).
 */
export function buildVerificationSteps(config: HarnessConfig): string[] {
  return buildVerificationStepsFromWorkflows(
    config.workflows.commands,
    config.workflows.verification.checks,
  );
}

export function buildVerificationStepsFromWorkflows(
  commands: WorkflowCommands,
  checks: string[],
): string[] {
  return checks.map((check, i) => {
    const cmd = commands[check];
    return `${i + 1}. Run \`${cmd ?? check}\` to verify ${check}.`;
  });
}

/** One line per check: `check: command` for plain docs. */
export function buildVerificationCheckLines(config: HarnessConfig): string[] {
  const { commands } = config.workflows;
  return config.workflows.verification.checks.map((check) => {
    const cmd = commands[check];
    return cmd?.trim() ? `- **${check}**: \`${cmd}\`` : `- **${check}**: _(no command in workflows.commands — add before running verify)_`;
  });
}
