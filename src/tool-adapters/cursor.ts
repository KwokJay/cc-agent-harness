import type { ToolAdapter, ToolAdapterContext, GeneratedFile, SkillContent } from "./types.js";
import { getDocsConstraintParagraph } from "../docs-scaffold/generator.js";
import { getChangelogConstraintParagraph } from "../changelog/generator.js";

export class CursorAdapter implements ToolAdapter {
  id = "cursor" as const;
  label = "Cursor";

  generate(ctx: ToolAdapterContext): GeneratedFile[] {
    const files = [
      this.projectRule(ctx),
      this.codingRule(ctx),
    ];
    for (const skill of ctx.skillContents) {
      files.push(this.skillRule(skill));
    }
    return files;
  }

  private projectRule(ctx: ToolAdapterContext): GeneratedFile {
    const lines = [
      `---`,
      `description: Project-level rules for ${ctx.projectName}`,
      `alwaysApply: true`,
      `---`,
      ``,
      `# Project: ${ctx.projectName}`,
      ``,
      `- **Type**: ${ctx.project.type}`,
      `- **Language**: ${ctx.project.language}`,
      ctx.project.framework ? `- **Framework**: ${ctx.project.framework}` : null,
      ``,
      `## Rules`,
      ``,
      ...ctx.customRules.map((r) => `- ${r}`),
      ``,
      `## Verification`,
      ``,
      `Before completing any task, run:`,
      ``,
      ...ctx.verificationChecks.map((c) => {
        const cmd = ctx.commands[c];
        return cmd ? `- \`${cmd}\`` : `- ${c}`;
      }),
      ``,
      ``,
      getDocsConstraintParagraph(),
      getChangelogConstraintParagraph(),
      `## Reference`,
      ``,
      `See AGENTS.md for full project instructions.`,
    ];

    return {
      path: ".cursor/rules/project.mdc",
      content: lines.filter((l) => l !== null).join("\n") + "\n",
      description: "Cursor project-level rule",
    };
  }

  private codingRule(ctx: ToolAdapterContext): GeneratedFile {
    const lines = [
      `---`,
      `description: Coding conventions for ${ctx.project.language} ${ctx.project.type} project`,
      `alwaysApply: true`,
      `---`,
      ``,
      `# Coding Conventions`,
      ``,
      `- Prefer editing existing files over creating new ones.`,
      `- Write clear, self-documenting code.`,
      `- Do not add comments that just narrate what the code does.`,
      `- Run tests after making changes.`,
      `- Run linters before finalizing.`,
    ];

    if (ctx.skills.length > 0) {
      lines.push(``);
      lines.push(`## Skill Packs`);
      lines.push(``);
      lines.push(`See .cursor/rules/skill-*.mdc for project-specific conventions.`);
    }

    return {
      path: ".cursor/rules/coding.mdc",
      content: lines.join("\n") + "\n",
      description: "Cursor coding conventions rule",
    };
  }

  private skillRule(skill: SkillContent): GeneratedFile {
    const lines = [
      `---`,
      `description: "Skill: ${skill.description}"`,
      `alwaysApply: true`,
      `---`,
      ``,
      skill.body,
    ];
    return {
      path: `.cursor/rules/skill-${skill.name}.mdc`,
      content: lines.join("\n") + "\n",
      description: `Cursor skill rule: ${skill.name}`,
    };
  }
}
