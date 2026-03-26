import { render, type TemplateContext } from "../../template/engine.js";

const TEMPLATE = `# Skill Extraction Task

## Prerequisites

Before starting, you MUST read these two files:

1. **\`.harness/skills/PROJECT-ANALYSIS.md\`** — Static analysis of this project (structure, dependencies, gaps)
2. **\`.harness/skills/skill-creator/SKILL.md\`** — The skill creation standard you MUST follow

## Context

This is a skill extraction task for **{{projectName}}** ({{projectSummaryLine}}).

Static analysis has already extracted these baseline skills:

{{existingList}}

## Your Task

Using the \`skill-creator\` methodology, extract deeper skills from this project's actual source code.

### Step 1: Read PROJECT-ANALYSIS.md

Understand what has already been analyzed and what gaps remain.

### Step 2: Deep-Read the Project

{{#if hasWorkspacePackages}}**Monorepo / workspace:** packages are listed in \`PROJECT-ANALYSIS.md\`. Prefer **one skill per bounded area** (e.g. per package or per layer) when patterns differ across packages; avoid one giant skill that mixes unrelated modules.

{{/if}}1. Read \`README.md\` and any documentation in \`.harness/docs/\`
2. Scan the full directory tree
3. Read the main entry point and 3-5 representative source files
4. Read configuration files and build scripts
5. Read 2-3 test files to understand testing patterns
6. Read any existing API routes, controllers, or service modules

### Step 3: Extract Skills Using skill-creator

For each pattern you identify, follow the \`skill-creator\` process:

1. **Understand the intent**: What convention or pattern should this skill capture?
2. **Write the description**: Specific enough to trigger correctly — include WHEN and WHAT
3. **Write the body**: Concrete rules with real examples from this project
4. **Validate**: Ensure frontmatter has \`name\` and \`description\`, body is under 500 lines

### Step 4: Organize by Dimension

**Technical skills** (extract if clear patterns exist):
- Architecture and module boundaries
- Error handling conventions
- Data access patterns
- State management
- Security patterns
- Performance conventions

**Business skills** (extract if domain logic exists):
- Domain model conventions
- Business rule patterns
- API contract conventions
- Data validation rules
- User-facing content guidelines

### Step 5: Write Each Skill

Create each skill as: \`.harness/skills/{name}/SKILL.md\`

Follow the format defined in \`skill-creator\`:

\`\`\`markdown
---
name: skill-name
description: What this skill captures and when to use it
---

# Skill Title

[Concrete rules and examples extracted from the actual codebase]
\`\`\`

### Step 6: Update INDEX.md

Update \`.harness/skills/INDEX.md\` with all new skills, separated by technical/business.

### Step 7: Distribute

Run \`agent-harness update\` to distribute new skills to each AI tool's native path.

## Quality Gates (from skill-creator)

- [ ] Each skill has \`name\` and \`description\` in frontmatter
- [ ] Description explains WHEN to trigger AND WHAT it enforces
- [ ] Body is actionable with real examples from this codebase
- [ ] Each skill is focused on ONE dimension
- [ ] Length is under 500 lines (use references/ for extras)
- [ ] Technical and business skills are clearly separated
- [ ] INDEX.md is updated
`;

export interface ExtractionTaskTemplateContext extends TemplateContext {
  projectName: string;
  projectSummaryLine: string;
  existingList: string;
  hasWorkspacePackages: boolean;
}

export function renderExtractionTaskDoc(ctx: ExtractionTaskTemplateContext): string {
  return render(TEMPLATE, ctx);
}
