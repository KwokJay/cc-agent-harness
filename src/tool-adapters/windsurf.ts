import type { ToolAdapter, ToolAdapterContext, GeneratedFile, SkillContent } from "./types.js";
import { getDocsConstraintParagraph } from "../docs-scaffold/generator.js";
import { getChangelogConstraintParagraph } from "../changelog/generator.js";
import { render, type TemplateContext } from "../template/engine.js";
import { WINDSURF_RULES_TEMPLATE, WINDSURF_SKILL_TEMPLATE } from "../templates/windsurf.js";

export class WindsurfAdapter implements ToolAdapter {
  id = "windsurf" as const;
  label = "Windsurf";

  generate(ctx: ToolAdapterContext): GeneratedFile[] {
    const files = [this.rulesFile(ctx)];
    for (const skill of ctx.skillContents) {
      files.push(this.skillFile(skill));
    }
    return files;
  }

  private rulesFile(ctx: ToolAdapterContext): GeneratedFile {
    const verificationLines = ctx.verificationChecks.map((c) => {
      const cmd = ctx.commands[c];
      return `\`${cmd ?? c}\``;
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
      path: ".windsurf/rules/project.md",
      content: render(WINDSURF_RULES_TEMPLATE, context),
      description: "Windsurf project rules",
    };
  }

  private skillFile(skill: SkillContent): GeneratedFile {
    const context: TemplateContext = {
      name: skill.name,
      body: skill.body,
    };

    return {
      path: `.windsurf/rules/skill-${skill.name}.md`,
      content: render(WINDSURF_SKILL_TEMPLATE, context),
      description: `Windsurf skill rule: ${skill.name}`,
    };
  }
}
