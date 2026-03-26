export const WINDSURF_RULES_TEMPLATE = `# {{projectName}}

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

export const WINDSURF_SKILL_TEMPLATE = `# {{name}}

{{body}}
`;
