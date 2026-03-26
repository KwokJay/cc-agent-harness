import type { GeneratedFile } from "../tool-adapters/types.js";
import type { ProjectTypeId } from "../project-types/types.js";

export function generateDocsDirectory(projectName: string, projectType: ProjectTypeId): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  files.push({
    path: "docs/README.md",
    content: docsReadme(projectName),
    description: "Documentation directory index",
  });

  files.push({
    path: "docs/requirements/README.md",
    content: sectionReadme("Requirements", "Product requirements, user stories, and acceptance criteria."),
    description: "Requirements section",
  });
  files.push({
    path: "docs/requirements/.gitkeep",
    content: "",
    description: "Requirements directory placeholder",
  });

  files.push({
    path: "docs/design/README.md",
    content: sectionReadme("Design", "UX/interaction design, wireframes, and design decisions."),
    description: "Design section",
  });
  files.push({
    path: "docs/design/.gitkeep",
    content: "",
    description: "Design directory placeholder",
  });

  files.push({
    path: "docs/architecture/README.md",
    content: sectionReadme("Architecture", "Technical architecture, system design, and API contracts."),
    description: "Architecture section",
  });
  files.push({
    path: "docs/architecture/.gitkeep",
    content: "",
    description: "Architecture directory placeholder",
  });

  files.push({
    path: "docs/testing/README.md",
    content: sectionReadme("Testing", "Test plans, test cases, and testing strategies."),
    description: "Testing section",
  });
  files.push({
    path: "docs/testing/.gitkeep",
    content: "",
    description: "Testing directory placeholder",
  });

  files.push({
    path: "docs/changelog/README.md",
    content: sectionReadme("Changelog", "Change records organized by date or version."),
    description: "Changelog section",
  });
  files.push({
    path: "docs/changelog/.gitkeep",
    content: "",
    description: "Changelog directory placeholder",
  });

  files.push({
    path: "docs/releases/README.md",
    content: sectionReadme("Releases", "Version release notes and deployment records."),
    description: "Releases section",
  });
  files.push({
    path: "docs/releases/.gitkeep",
    content: "",
    description: "Releases directory placeholder",
  });

  files.push({
    path: "docs/CONVENTIONS.md",
    content: docsConventions(projectName),
    description: "Documentation conventions and constraints",
  });

  return files;
}

export function generateDocsConstraintRule(projectName: string): GeneratedFile {
  return {
    path: ".harness/skills/docs-governance/SKILL.md",
    content: docsGovernanceSkill(projectName),
    description: "Skill: documentation governance constraints",
  };
}

function docsReadme(projectName: string): string {
  return `# ${projectName} Documentation

This directory contains all project documentation, organized by lifecycle phase.

## Structure

| Directory | Purpose |
|-----------|---------|
| \`requirements/\` | Product requirements, user stories, acceptance criteria |
| \`design/\` | UX/interaction design, wireframes, design decisions |
| \`architecture/\` | Technical architecture, system design, API contracts |
| \`testing/\` | Test plans, test cases, testing strategies |
| \`changelog/\` | Change records by date or version |
| \`releases/\` | Version release notes and deployment records |

## Conventions

See [CONVENTIONS.md](./CONVENTIONS.md) for naming, formatting, and maintenance rules.

## Important

All project documentation MUST be created within this directory structure.
Do not create documentation files outside of \`docs/\` unless they are standard
root-level files (README.md, CHANGELOG.md, LICENSE, etc.).
`;
}

function sectionReadme(title: string, description: string): string {
  return `# ${title}

${description}

## Naming Convention

- Use lowercase with hyphens: \`feature-user-auth.md\`
- Prefix with date for time-sensitive documents: \`2026-03-25-sprint-review.md\`
- Use descriptive names that indicate content, not generic names like \`doc1.md\`
`;
}

function docsConventions(projectName: string): string {
  return `# Documentation Conventions for ${projectName}

## File Placement Rules

1. **All documentation MUST live under \`docs/\`** in the appropriate subdirectory.
2. **Root-level exceptions**: Only \`README.md\`, \`CHANGELOG.md\`, \`CONTRIBUTING.md\`, \`LICENSE\`, \`AGENTS.md\`, and \`CLAUDE.md\` may exist at the repository root.
3. **No scattered docs**: Do not create \`.md\` files in \`src/\`, \`app/\`, or other code directories for project documentation. Code-level docs (JSDoc, docstrings) are fine.

## Naming Rules

- Use lowercase with hyphens: \`api-design-v2.md\`
- Prefix time-sensitive docs with ISO date: \`2026-03-25-migration-plan.md\`
- Use the section name as context, not redundant prefixes: \`docs/requirements/user-auth.md\` not \`docs/requirements/req-user-auth.md\`

## Format Rules

- Start every document with a level-1 heading matching the filename intent.
- Include a "Last Updated" line or use git blame for tracking.
- Use Markdown tables for structured comparisons.
- Use code blocks with language tags for technical examples.

## Cross-References

- Link between docs using relative paths: \`[See architecture](../architecture/api-design.md)\`
- Maintain the section README as an index of documents within that section.

## Change Records

- \`changelog/\`: One file per significant change or sprint, describing what changed and why.
- \`releases/\`: One file per version release, summarizing included changes.

## Maintenance

- When adding a new document, update the section's \`README.md\` index.
- When removing a feature, archive its docs rather than deleting.
- Run \`agent-harness doctor\` to verify documentation structure integrity.
`;
}

function docsGovernanceSkill(projectName: string): string {
  return `---
name: docs-governance
description: Enforce documentation placement, naming, and maintenance rules. Use whenever creating, moving, or updating project documentation.
---

# Documentation Governance

When working on documentation for ${projectName}, follow these strict rules:

## Placement

- ALL project documentation MUST be placed under \`docs/\` in the correct subdirectory:
  - Requirements -> \`docs/requirements/\`
  - Design -> \`docs/design/\`
  - Architecture -> \`docs/architecture/\`
  - Testing -> \`docs/testing/\`
  - Changelog -> \`docs/changelog/\`
  - Releases -> \`docs/releases/\`
- NEVER create documentation files in \`src/\`, \`app/\`, or other code directories.
- Only standard root files are allowed outside \`docs/\`: README.md, CHANGELOG.md, CONTRIBUTING.md, LICENSE, AGENTS.md, CLAUDE.md.

## Naming

- Use lowercase with hyphens: \`feature-name.md\`
- Prefix time-sensitive docs with ISO date: \`2026-03-25-topic.md\`

## After Creating a Document

1. Update the section's \`README.md\` to list the new document.
2. If the document references other docs, use relative paths.

## Review Checklist

- [ ] Document is in the correct \`docs/\` subdirectory
- [ ] Filename follows naming convention
- [ ] Section README.md is updated
- [ ] Cross-references use relative paths
`;
}
