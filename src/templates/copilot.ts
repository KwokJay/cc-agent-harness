export const COPILOT_INSTRUCTIONS_TEMPLATE = `# Copilot Instructions for {{projectName}}

## Project

- **Type**: {{project.type}}
- **Language**: {{project.language}}
{{#if project.framework}}- **Framework**: {{project.framework}}
{{/if}}
## Coding Guidelines

{{#each customRules}}- {{.}}
{{/each}}
## Verification

Before finalizing changes, ensure the following checks pass:

{{#each verificationLines}}- {{.}}
{{/each}}
{{docsConstraint}}
{{changelogConstraint}}
## Additional Context

See AGENTS.md in the repository root for complete project instructions.
`;

export const COPILOT_SKILL_TEMPLATE = `---
applyTo: "**"
---

{{body}}
`;
