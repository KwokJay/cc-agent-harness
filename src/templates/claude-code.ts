export const CLAUDE_MD_TEMPLATE = `# {{projectName}}

Read @AGENTS.md for full project instructions, coding guidelines, and verification protocol.

## Quick Reference

- **Type**: {{project.type}}
- **Language**: {{project.language}}
{{#if project.framework}}- **Framework**: {{project.framework}}
{{/if}}
{{#if hasCustomRules}}## Project Rules

{{#each customRules}}- {{.}}
{{/each}}
{{/if}}{{#if hasVerification}}## Before Completing Any Task

{{#each verificationLines}}- {{.}}
{{/each}}
{{/if}}{{docsConstraint}}
{{changelogConstraint}}`;

export const CLAUDE_VERIFY_COMMAND_TEMPLATE = `Run the project verification pipeline:

\`\`\`shell
{{verifyCommand}}
\`\`\`

Report the results of each step.
`;

export const CLAUDE_SKILL_TEMPLATE = `---
name: {{name}}
description: {{description}}
---

{{body}}
`;
