import type { GeneratedFile } from "../tool-adapters/types.js";
import type { ProjectTypeId } from "../project-types/types.js";

export function generateDocsDirectory(_projectName: string, _projectType: ProjectTypeId): GeneratedFile[] {
  return [];
}

export function generateDocsConstraintRule(projectName: string): GeneratedFile {
  return {
    path: ".harness/skills/docs-governance/SKILL.md",
    content: docsGovernanceSkill(projectName),
    description: "Skill: documentation governance constraints",
  };
}

export function getDocsConstraintParagraph(): string {
  return [
    "## Documentation Rules",
    "",
    "All project documentation MUST be organized under `.harness/docs/{feature-name}/` with subdirectories by type:",
    "- `requirements/` - product requirements and user stories",
    "- `design/` - UX/interaction design and wireframes",
    "- `architecture/` - technical design and API contracts",
    "- `testing/` - test plans and test cases",
    "- `releases/` - version release notes",
    "",
    "When creating documentation, first create the feature directory if it does not exist, then place the document in the correct type subdirectory. Use lowercase-hyphenated names. Do NOT create documentation files outside `.harness/docs/`.",
    "",
  ].join("\n");
}

function docsGovernanceSkill(projectName: string): string {
  return `---
name: docs-governance
description: Enforce documentation placement, naming, and maintenance rules for ${projectName}. Use whenever creating, moving, or updating project documentation.
---

# Documentation Governance

When working on documentation for ${projectName}, follow these strict rules.

## Directory Structure

All project documentation MUST be organized under \`.harness/docs/\` by feature:

\`\`\`text
.harness/docs/
  {feature-name}/
    requirements/        product requirements, user stories, acceptance criteria
    design/              UX, interaction design, wireframes, design decisions
    architecture/        technical design, API contracts, data models
    testing/             test plans, test cases, testing strategies
    releases/            version release notes
    README.md            feature overview and document index
\`\`\`

## When Creating Documentation

1. Identify which feature the document belongs to
2. Create \`.harness/docs/{feature-name}/\` if it does not exist
3. Create a \`README.md\` in the feature directory listing its contents
4. Create the appropriate subdirectory (\`requirements/\`, \`design/\`, etc.) if needed
5. Place the document in the correct subdirectory
6. Update the feature \`README.md\` to index the new document

## Placement Rules

- ALL documentation MUST live under \`.harness/docs/{feature}/{type}/\`
- NEVER create documentation in \`src/\`, \`app/\`, or other code directories
- Only these files may exist at repository root: README.md, CHANGELOG.md, CONTRIBUTING.md, LICENSE, AGENTS.md, CLAUDE.md

## Naming Rules

- Feature names: lowercase-hyphenated (\`user-auth\`, \`payment-flow\`, \`search-v2\`)
- File names: lowercase-hyphenated, descriptive (\`api-design-v2.md\`)
- Time-sensitive: prefix with ISO date (\`2026-03-25-migration-plan.md\`)
- No generic names like \`doc1.md\` or \`notes.md\`

## Document Format

Every document should start with:

\`\`\`markdown
# [Title]

## Overview
[Brief description]

## [Content sections...]

## Related
- [Links to related docs using relative paths]
\`\`\`

## Cross-References

- Use relative paths: \`[See API design](../api-gateway/architecture/api-v2.md)\`
- Always update the feature README when adding or removing documents

## Review Checklist

Before finalizing any documentation:

- [ ] Document is in \`.harness/docs/{feature}/{type}/\`
- [ ] Feature README.md exists and indexes this document
- [ ] Filename follows naming convention
- [ ] Cross-references use relative paths
- [ ] No documentation was created outside \`.harness/docs/\`
`;
}
