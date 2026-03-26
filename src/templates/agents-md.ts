export const AGENTS_MD_TEMPLATE = `# {{projectName}}

## Project Info

- **Type**: {{project.type}}
- **Language**: {{project.language}}
{{#if project.framework}}- **Framework**: {{project.framework}}
{{/if}}
## Coding Guidelines

- Follow established project conventions and style guides.
- Write clear, self-documenting code with minimal comments.
- Prefer editing existing files over creating new ones.
- Run tests after making changes to verify correctness.
- Run linters/formatters before finalizing changes.

{{#if hasCustomRules}}## Project-Specific Rules

{{#each customRules}}- {{.}}
{{/each}}
{{/if}}{{#if hasCommands}}## Available Commands

| Command | Purpose |
|---------|---------|
{{#each commandEntries}}| \`{{cmd}}\` | {{name}} |
{{/each}}
{{/if}}{{#if hasVerification}}## Verification Protocol

Before claiming any task is complete:

{{#each verificationSteps}}{{.}}
{{/each}}
{{/if}}{{docsConstraint}}
{{changelogConstraint}}
{{#if hasSkills}}## Skills

The following skill packs are available in \`.harness/skills/\`:

{{#each skills}}- **{{.}}**
{{/each}}
{{/if}}`;
