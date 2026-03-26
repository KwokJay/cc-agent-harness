import type { ToolAdapter, ToolAdapterContext, GeneratedFile, SkillContent } from "./types.js";
import { getDocsConstraintParagraph } from "../docs-scaffold/generator.js";
import { getChangelogConstraintParagraph } from "../changelog/generator.js";
import { render, type TemplateContext } from "../template/engine.js";
import {
  CURSOR_PROJECT_RULE_TEMPLATE,
  CURSOR_CODING_RULE_TEMPLATE,
  CURSOR_SKILL_RULE_TEMPLATE,
} from "../templates/cursor.js";

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
    const verificationLines = ctx.verificationChecks.map((c) => {
      const cmd = ctx.commands[c];
      return cmd ? `\`${cmd}\`` : c;
    });

    const context: TemplateContext = {
      projectName: ctx.projectName,
      project: {
        type: ctx.project.type,
        language: ctx.project.language,
        framework: ctx.project.framework,
      },
      customRules: ctx.customRules,
      verificationLines,
      docsConstraint: getDocsConstraintParagraph(),
      changelogConstraint: getChangelogConstraintParagraph(),
    };

    return {
      path: ".cursor/rules/project.mdc",
      content: render(CURSOR_PROJECT_RULE_TEMPLATE, context),
      description: "Cursor project-level rule",
    };
  }

  private codingRule(ctx: ToolAdapterContext): GeneratedFile {
    const context: TemplateContext = {
      project: {
        type: ctx.project.type,
        language: ctx.project.language,
      },
      hasSkills: ctx.skills.length > 0,
    };

    return {
      path: ".cursor/rules/coding.mdc",
      content: render(CURSOR_CODING_RULE_TEMPLATE, context),
      description: "Cursor coding conventions rule",
    };
  }

  private skillRule(skill: SkillContent): GeneratedFile {
    const context: TemplateContext = {
      description: skill.description,
      body: skill.body,
    };

    return {
      path: `.cursor/rules/skill-${skill.name}.mdc`,
      content: render(CURSOR_SKILL_RULE_TEMPLATE, context),
      description: `Cursor skill rule: ${skill.name}`,
    };
  }
}
