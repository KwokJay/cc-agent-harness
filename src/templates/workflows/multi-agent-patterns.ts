export function buildMultiAgentPatternsMarkdown(projectName: string): string {
  return `# Multi-agent patterns — ${projectName}

Optional **role splits** for complex work. These are conventions for humans and agents; Harness does not spawn agents.

## Initializer / Executor

| Role | Responsibility |
|------|------------------|
| **Initializer** | Reads requirements, explores the repo, proposes file-level plan and acceptance criteria. |
| **Executor** | Implements following the plan, runs tests/linters, reports diffs and risks. |

**Checklist**

- [ ] Initializer output includes scope, non-goals, and file paths to touch.
- [ ] Executor does not expand scope without explicit approval.
- [ ] Both roles respect \`AGENTS.md\` and \`.harness/workflows/ralph-loop.md\`.

## Supervisor (review gate)

| Role | Responsibility |
|------|------------------|
| **Supervisor** | Reviews Executor output against plan, runs or requests \`agent-harness verify\`, blocks "done" until green. |

**Checklist**

- [ ] Supervisor runs \`agent-harness verify\` (or confirms CI equivalent) before sign-off.
- [ ] Failed checks are assigned back to Executor with concrete fixes.

## Tips

- Keep a single source of truth for verification commands: \`.harness/config.yaml\` (\`workflows.commands\` + \`workflows.verification.checks\`).
- For long sessions, align with memory rules in \`AGENTS.md\` (working vs long-term context).
`;
}
