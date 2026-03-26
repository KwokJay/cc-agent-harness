import type { GeneratedFile } from "../tool-adapters/types.js";
import type { DetectedProject } from "../project-types/types.js";

export function generateSkillExtractionGuide(
  projectName: string,
  project: DetectedProject,
): GeneratedFile[] {
  return [
    {
      path: ".harness/skills/project-skill-extractor/SKILL.md",
      content: extractorSkillMd(projectName, project),
      description: "Skill: automated project skill extraction guide",
      harnessSkillSource: "preset",
    },
  ];
}

function extractorSkillMd(projectName: string, project: DetectedProject): string {
  return `---
name: project-skill-extractor
description: Extract reusable technical and business skills from the ${projectName} codebase. Use after initialization or when asked to "extract skills", "analyze project conventions", or "create project skills".
---

# Project Skill Extractor

Extract high-quality, reusable skills from the **${projectName}** project (${project.type} / ${project.language}${project.framework ? ` / ${project.framework}` : ""}).

## Extraction Process

### Phase 1: Project Scan

Read and understand the project structure:

1. Read \`README.md\`, \`AGENTS.md\`, and any existing documentation in \`docs/\`
2. Scan the directory tree to understand module organization
3. Read \`package.json\` / \`pyproject.toml\` / build files for dependencies and scripts
4. Read configuration files (.eslintrc, tsconfig, ruff.toml, etc.) for tool conventions
5. Sample 3-5 representative source files to understand coding patterns
6. Read test files to understand testing patterns

### Phase 2: Technical Skill Extraction

Extract skills for each of these dimensions:

| Dimension | What to Look For |
|-----------|-----------------|
| **Language Conventions** | Naming patterns, import organization, type usage |
| **Architecture Patterns** | Module boundaries, layering, dependency direction |
| **Error Handling** | Error types, handling patterns, logging conventions |
| **Testing Patterns** | Test organization, assertion style, fixture patterns |
| **Build & Deploy** | Build commands, CI patterns, deployment workflow |
| **Code Organization** | Directory structure conventions, file naming |

For each dimension, create a skill if there are clear, consistent patterns worth preserving.

### Phase 3: Business Skill Extraction

Extract skills for domain-specific conventions:

| Dimension | What to Look For |
|-----------|-----------------|
| **Domain Model** | Entity naming, relationship patterns, validation rules |
| **API Contracts** | Endpoint patterns, request/response shapes, versioning |
| **Data Validation** | Input validation patterns, sanitization rules |
| **Business Rules** | Domain logic patterns, state transitions |
| **User-Facing Content** | Copy conventions, i18n patterns, accessibility |

Only create business skills if the project has clear domain patterns.

### Phase 4: Skill Writing

For each extracted skill:

1. Create a directory under \`.harness/skills/\` with a descriptive name
2. Write \`SKILL.md\` with proper frontmatter:

\`\`\`markdown
---
name: skill-name
description: What this skill captures and when to use it
---

# Skill Title

[Concrete rules, patterns, and examples extracted from the codebase]
\`\`\`

3. Keep each skill focused on ONE dimension
4. Include real code examples from the project (anonymized if needed)
5. Write actionable rules, not abstract descriptions

### Phase 5: Generate Skill Index

After extraction, create \`.harness/skills/INDEX.md\`:

\`\`\`markdown
# Project Skills Index

## Technical Skills
- **skill-name**: one-line description

## Business Skills
- **skill-name**: one-line description
\`\`\`

## Quality Gates

Before finalizing extracted skills:

- [ ] Each skill has \`name\` and \`description\` in frontmatter
- [ ] Description explains WHEN to trigger and WHAT it enforces
- [ ] Body contains concrete rules with examples
- [ ] No skill exceeds 500 lines
- [ ] Technical and business skills are clearly separated
- [ ] INDEX.md lists all skills

## After Extraction

Run \`agent-harness update\` to distribute extracted skills to each AI tool's native path.
`;
}
