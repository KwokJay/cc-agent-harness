export const CURSOR_PROJECT_RULE_TEMPLATE = `---
description: Project-level rules for {{projectName}}
alwaysApply: true
---

# Project: {{projectName}}

- **Type**: {{project.type}}
- **Language**: {{project.language}}
{{#if project.framework}}- **Framework**: {{project.framework}}
{{/if}}
## Rules

{{#each customRules}}- {{.}}
{{/each}}
## Verification

Before completing any task, run:

{{#each verificationLines}}- {{.}}
{{/each}}

{{docsConstraint}}
{{changelogConstraint}}
## Reference

See AGENTS.md for full project instructions.
`;

export const CURSOR_CODING_RULE_TEMPLATE = `---
description: Coding conventions for {{project.language}} {{project.type}} project
alwaysApply: true
---

# Coding Conventions

- Prefer editing existing files over creating new ones.
- Write clear, self-documenting code.
- Do not add comments that just narrate what the code does.
- Run tests after making changes.
- Run linters before finalizing.
{{#if hasSkills}}
## Skill Packs

See .cursor/rules/skill-*.mdc for project-specific conventions.
{{/if}}`;

export const CURSOR_SKILL_RULE_TEMPLATE = `---
description: "Skill: {{description}}"
alwaysApply: true
---

{{body}}
`;
