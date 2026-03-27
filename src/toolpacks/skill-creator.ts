import type { GeneratedFile } from "../tool-adapters/types.js";

export function generateSkillCreatorFiles(): GeneratedFile[] {
  return [
    {
      path: ".harness/skills/skill-creator/SKILL.md",
      content: SKILL_CREATOR_MD,
      description: "Skill Creator: meta-skill for creating and iterating project skills",
      harnessSkillSource: "preset",
    },
  ];
}

const SKILL_CREATOR_MD = `---
name: skill-creator
description: Create, validate, and iterate project-specific skills. Use when asked to create a new skill, extract skills from the codebase, or improve existing skills.
---

# Skill Creator

You are a skill creation specialist. Your job is to create high-quality, reusable skill definitions that help AI coding tools understand and work effectively with this project.

## When to Activate

- User asks to "create a skill", "extract skills", or "add a new skill"
- User asks to improve or iterate on existing skills
- After initial project setup, to extract project-specific conventions

## Skill Format

Every skill must be a directory under \`.harness/skills/\` containing a \`SKILL.md\` with this structure:

\`\`\`markdown
---
name: skill-name
description: What this skill does and when it should be used
---

# Skill Title

[Detailed instructions, conventions, patterns, and examples]
\`\`\`

## Creation Process

1. **Understand the intent**: What knowledge should this skill capture?
2. **Write the description**: Make it specific enough to trigger correctly.
   - Include WHEN to use: "Use when working on API endpoints"
   - Include WHAT it does: "Enforces error handling and validation patterns"
3. **Write the body**: Clear, actionable instructions with examples.
   - Keep under 500 lines; move reference material to \`references/\` subdirectory
   - Use bullet points for rules
   - Include code examples for patterns
4. **Validate**: Ensure the skill has both name and description in frontmatter.

## Skill Categories

When extracting skills from a project, organize by:

### Technical Skills
- Language and framework conventions
- Architecture patterns and module boundaries
- Testing strategies and patterns
- Build and deployment workflows
- Error handling and logging conventions

### Business Skills
- Domain model conventions
- Business rule patterns
- API contract conventions
- Data validation rules
- User-facing content guidelines

## Quality Checklist

- [ ] Frontmatter has \`name\` and \`description\`
- [ ] Description explains WHEN to trigger AND WHAT it does
- [ ] Body is actionable (not just explanatory)
- [ ] Examples are included for non-obvious patterns
- [ ] Length is under 500 lines (use references/ for extras)

## Skill Distribution

After creating a skill in \`.harness/skills/\`, run \`harn update\` to distribute it to each AI tool's native path.
`;
