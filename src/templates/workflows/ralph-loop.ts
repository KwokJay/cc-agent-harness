import type { WorkflowCommands } from "../../project-types/types.js";
import {
  buildVerificationCheckLines,
  buildVerificationStepsFromWorkflows,
} from "../../workflows/verification-copy.js";
import type { HarnessConfig } from "../../config/schema.js";

export function buildRalphLoopMarkdown(
  projectName: string,
  commands: WorkflowCommands,
  checks: string[],
): string {
  const configSlice: HarnessConfig = {
    project: { name: projectName, type: "backend", language: "unknown" },
    tools: [],
    workflows: { commands, verification: { checks } },
    custom_rules: [],
  };

  const steps = buildVerificationStepsFromWorkflows(commands, checks);
  const lines = buildVerificationCheckLines(configSlice);

  const stepsBlock = steps.length > 0 ? steps.join("\n") : "_No verification checks configured in `.harness/config.yaml` — add `workflows.verification.checks`._";

  return `# Ralph-style verify loop — ${projectName}

This workflow is **documentation**: run steps in your IDE or script; Harness does not run a background agent.

## Rule

**Do not claim a task is complete** until \`agent-harness verify\` exits successfully (same checks as AGENTS.md *Verification Protocol*).

## Loop

1. Implement or fix the task.
2. Run local checks as needed.
3. Run the project verifier (from repository root):

   \`\`\`shell
   agent-harness verify
   \`\`\`

4. If verify fails, fix issues and repeat from step 1.

## Checks (from config)

${lines.join("\n")}

## Ordered steps (same wording as AGENTS.md)

${stepsBlock}

## Optional automation

You can run verify in CI or a git hook; keep commands in \`.harness/config.yaml\` so this file and AGENTS.md stay aligned.
`;
}
