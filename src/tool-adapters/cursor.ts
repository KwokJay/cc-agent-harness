import type { ToolAdapter, ToolAdapterContext, GeneratedFile, SkillContent, ToolCapability } from "./types.js";
import { render, type TemplateContext } from "../template/engine.js";
import { buildProjectRuleContext } from "./shared.js";
import {
  CURSOR_PROJECT_RULE_TEMPLATE,
  CURSOR_CODING_RULE_TEMPLATE,
  CURSOR_SKILL_RULE_TEMPLATE,
} from "../templates/cursor.js";

export class CursorAdapter implements ToolAdapter {
  id = "cursor" as const;
  label = "Cursor";
  setupSummary = ".cursor/rules/ ready";
  readonly capability: ToolCapability = {
    tier: "first-class",
    generation: true,
    diagnose: true,
    mcp: true,
    extractionAuto: false,
    extractionManualFallback: true,
  };

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
    const context: TemplateContext = buildProjectRuleContext(ctx);

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
