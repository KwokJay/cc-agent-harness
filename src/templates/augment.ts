export const AUGMENT_GUIDELINES_TEMPLATE = `# {{projectName}}

## Project

- **Type**: {{project.type}}
- **Language**: {{project.language}}
{{#if project.framework}}- **Framework**: {{project.framework}}
{{/if}}
## Coding Guidelines

{{#each customRules}}- {{.}}
{{/each}}
## Verification

{{#each verificationLines}}- {{.}}
{{/each}}
{{docsConstraint}}
{{changelogConstraint}}
## Reference

See AGENTS.md for full project instructions.
`;

export const AUGMENT_SKILL_TEMPLATE = `---
name: {{name}}
description: {{description}}
---

{{body}}
`;
