import type { GeneratedFile } from "../tool-adapters/types.js";
import type { ProjectTypeId } from "../project-types/types.js";

const DOC_TYPES = [
  { dir: "requirements", label: "Requirements", desc: "Product requirements, user stories, and acceptance criteria" },
  { dir: "design", label: "Design", desc: "UX/interaction design, wireframes, and design decisions" },
  { dir: "architecture", label: "Architecture", desc: "Technical architecture, system design, and API contracts" },
  { dir: "testing", label: "Testing", desc: "Test plans, test cases, and testing strategies" },
  { dir: "changelog", label: "Changelog", desc: "Change records organized by date or version" },
  { dir: "releases", label: "Releases", desc: "Version release notes and deployment records" },
] as const;

export function generateDocsDirectory(projectName: string, _projectType: ProjectTypeId): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  files.push({
    path: ".harness/docs/README.md",
    content: docsRootReadme(projectName),
    description: "Documentation root index",
  });

  files.push({
    path: ".harness/docs/CONVENTIONS.md",
    content: docsConventions(projectName),
    description: "Documentation conventions and constraints",
  });

  files.push({
    path: ".harness/docs/_templates/requirement.md",
    content: requirementTemplate(),
    description: "Template: requirement document",
  });

  files.push({
    path: ".harness/docs/_templates/design.md",
    content: designTemplate(),
    description: "Template: design document",
  });

  files.push({
    path: ".harness/docs/_templates/architecture.md",
    content: architectureTemplate(),
    description: "Template: architecture document",
  });

  files.push({
    path: ".harness/docs/_templates/test-plan.md",
    content: testPlanTemplate(),
    description: "Template: test plan document",
  });

  files.push({
    path: ".harness/docs/_templates/changelog-entry.md",
    content: changelogTemplate(),
    description: "Template: changelog entry",
  });

  files.push({
    path: ".harness/docs/_templates/release-note.md",
    content: releaseNoteTemplate(),
    description: "Template: release note",
  });

  files.push({
    path: ".harness/docs/_templates/module-readme.md",
    content: moduleReadmeTemplate(),
    description: "Template: module README for new doc modules",
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

function docsRootReadme(projectName: string): string {
  return `# ${projectName} Documentation

All project documentation lives under \`.harness/docs/\`, organized by module.

## Directory Structure

\`\`\`text
.harness/docs/
  README.md              <- this file
  CONVENTIONS.md         <- naming, formatting, and maintenance rules
  _templates/            <- document templates for each type
  {module-name}/         <- one directory per module or feature domain
    requirements/        <- product requirements
    design/              <- UX/interaction design
    architecture/        <- technical design and API contracts
    testing/             <- test plans and test cases
    changelog/           <- change records
    releases/            <- version release notes
    README.md            <- module overview and document index
\`\`\`

## How to Add a New Module

1. Create a directory: \`.harness/docs/{module-name}/\`
2. Copy the module README template: \`cp _templates/module-readme.md {module-name}/README.md\`
3. Create subdirectories as needed: \`requirements/\`, \`design/\`, \`architecture/\`, \`testing/\`
4. Use templates from \`_templates/\` for each document type

## Rules

- ALL project documentation MUST be placed under \`.harness/docs/{module}/\`
- Use lowercase-hyphenated directory and file names
- Update the module README.md when adding new documents
- See [CONVENTIONS.md](./CONVENTIONS.md) for full rules
`;
}

function docsConventions(projectName: string): string {
  return `# Documentation Conventions for ${projectName}

## Placement Rules

1. **All documentation MUST live under \`.harness/docs/\`** organized by module.
2. Each module gets its own directory: \`.harness/docs/{module-name}/\`
3. Inside each module, organize by document type:
   - \`requirements/\` - product requirements and user stories
   - \`design/\` - UX, interaction design, wireframes
   - \`architecture/\` - technical design, API contracts, data models
   - \`testing/\` - test plans, test cases
   - \`changelog/\` - change records
   - \`releases/\` - version release notes
4. **Root-level exceptions**: Only README.md, CHANGELOG.md, CONTRIBUTING.md, LICENSE, AGENTS.md, and CLAUDE.md may exist at the repository root.
5. **No scattered docs**: Do not create project documentation in \`src/\`, \`app/\`, or other code directories.

## Module Directory Rules

- Module names use lowercase-hyphenated format: \`user-auth\`, \`payment-service\`, \`api-gateway\`
- Each module directory MUST have a \`README.md\` that indexes all documents within
- Cross-module references use relative paths: \`[See API design](../api-gateway/architecture/api-v2.md)\`

## Naming Rules

- Use lowercase with hyphens: \`user-auth-requirements.md\`
- Prefix time-sensitive docs with ISO date: \`2026-03-25-sprint-review.md\`
- Use descriptive names, not generic: \`payment-flow.md\` not \`doc1.md\`

## Templates

Use templates from \`.harness/docs/_templates/\` when creating new documents:
- \`requirement.md\` - for product requirements
- \`design.md\` - for UX/interaction design
- \`architecture.md\` - for technical architecture
- \`test-plan.md\` - for test plans
- \`changelog-entry.md\` - for change records
- \`release-note.md\` - for release notes
- \`module-readme.md\` - for new module README

## Maintenance

- When adding a document, update the module's README.md index
- When removing a feature, archive docs rather than deleting
- Changelog entries reference the module they affect
`;
}

function requirementTemplate(): string {
  return `# [Requirement Title]

## Overview

[Brief description of the requirement]

## User Stories

- As a [role], I want to [action] so that [benefit]

## Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Priority

[High / Medium / Low]

## Notes

[Additional context, constraints, dependencies]
`;
}

function designTemplate(): string {
  return `# [Design Title]

## Problem Statement

[What problem does this design solve?]

## Proposed Solution

[Description of the design approach]

## User Flow

[Step-by-step user interaction flow]

## Wireframes / Mockups

[Links or descriptions of visual designs]

## Open Questions

- [Question 1]

## Decision Record

| Date | Decision | Rationale |
|------|----------|-----------|
| | | |
`;
}

function architectureTemplate(): string {
  return `# [Architecture Title]

## Context

[Why is this design needed? What constraints exist?]

## Decision

[The chosen approach]

## Components

[Key components and their responsibilities]

## Data Flow

[How data moves through the system]

## API Contracts

[Endpoint definitions, request/response shapes]

## Trade-offs

[What was considered and rejected, and why]

## Dependencies

[External services, libraries, or systems involved]
`;
}

function testPlanTemplate(): string {
  return `# [Test Plan Title]

## Scope

[What is being tested]

## Test Strategy

[Unit / Integration / E2E / Manual]

## Test Cases

| ID | Description | Input | Expected Output | Status |
|----|-------------|-------|-----------------|--------|
| TC-01 | | | | |

## Environment

[Test environment requirements]

## Exit Criteria

- [ ] All critical test cases pass
- [ ] No P0/P1 bugs open
`;
}

function changelogTemplate(): string {
  return `# [Date or Version] - [Change Title]

## Module

[Which module is affected]

## Changes

- [Change 1]
- [Change 2]

## Impact

[What is affected by this change]

## Related Documents

- [Link to requirement]
- [Link to design]
`;
}

function releaseNoteTemplate(): string {
  return `# Release [Version]

## Date

[Release date]

## Highlights

- [Highlight 1]
- [Highlight 2]

## Changes

### Added
- [New feature]

### Changed
- [Modified behavior]

### Fixed
- [Bug fix]

## Known Issues

- [Issue 1]

## Upgrade Notes

[Any special steps needed for upgrading]
`;
}

function moduleReadmeTemplate(): string {
  return `# [Module Name]

## Overview

[Brief description of this module's purpose and scope]

## Documents

### Requirements
- [Link to requirements docs]

### Design
- [Link to design docs]

### Architecture
- [Link to architecture docs]

### Testing
- [Link to test plans]

### Changelog
- [Link to change records]
`;
}

function docsGovernanceSkill(projectName: string): string {
  return `---
name: docs-governance
description: Enforce documentation placement, naming, and maintenance rules for ${projectName}. Use whenever creating, moving, or updating project documentation.
---

# Documentation Governance

When working on documentation for ${projectName}, follow these strict rules:

## Placement

- ALL project documentation MUST be placed under \`.harness/docs/{module-name}/\` in the correct subdirectory:
  - Requirements -> \`.harness/docs/{module}/requirements/\`
  - Design -> \`.harness/docs/{module}/design/\`
  - Architecture -> \`.harness/docs/{module}/architecture/\`
  - Testing -> \`.harness/docs/{module}/testing/\`
  - Changelog -> \`.harness/docs/{module}/changelog/\`
  - Releases -> \`.harness/docs/{module}/releases/\`
- NEVER create documentation files in \`src/\`, \`app/\`, or other code directories.
- Only standard root files are allowed outside \`.harness/docs/\`: README.md, CHANGELOG.md, CONTRIBUTING.md, LICENSE, AGENTS.md, CLAUDE.md.

## Creating a New Module

1. Create directory: \`.harness/docs/{module-name}/\`
2. Copy template: \`.harness/docs/_templates/module-readme.md\` -> \`.harness/docs/{module-name}/README.md\`
3. Create needed subdirectories: \`requirements/\`, \`design/\`, \`architecture/\`, \`testing/\`

## Creating a New Document

1. Identify the module and document type
2. Copy the appropriate template from \`.harness/docs/_templates/\`
3. Place it in \`.harness/docs/{module}/{type}/\`
4. Update the module's README.md to list the new document

## Naming

- Module names: lowercase-hyphenated (\`user-auth\`, \`payment-service\`)
- File names: lowercase-hyphenated, descriptive (\`api-design-v2.md\`)
- Time-sensitive: prefix with ISO date (\`2026-03-25-migration-plan.md\`)

## Review Checklist

- [ ] Document is in \`.harness/docs/{module}/{type}/\`
- [ ] Module README.md is updated
- [ ] Template was used as starting point
- [ ] Cross-references use relative paths
- [ ] Filename follows naming convention
`;
}
