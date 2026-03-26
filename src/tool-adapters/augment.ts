import type { ToolAdapter, ToolAdapterContext, GeneratedFile, SkillContent } from "./types.js";
import { getDocsConstraintParagraph } from "../docs-scaffold/generator.js";
import { getChangelogConstraintParagraph } from "../changelog/generator.js";
import { render, type TemplateContext } from "../template/engine.js";
import { AUGMENT_GUIDELINES_TEMPLATE, AUGMENT_SKILL_TEMPLATE } from "../templates/augment.js";

export class AugmentAdapter implements ToolAdapter {
  id = "augment" as const;
  label = "Augment Code";

  generate(ctx: ToolAdapterContext): GeneratedFile[] {
    const files = [this.guidelinesFile(ctx)];
    for (const skill of ctx.skillContents) {
      files.push(this.skillFile(skill));
    }
    return files;
  }

  private guidelinesFile(ctx: ToolAdapterContext): GeneratedFile {
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
      path: "augment-guidelines.md",
      content: render(AUGMENT_GUIDELINES_TEMPLATE, context),
      description: "Augment Code project guidelines",
    };
  }

  private skillFile(skill: SkillContent): GeneratedFile {
    const context: TemplateContext = {
      name: skill.name,
      description: skill.description,
      body: skill.body,
    };

    return {
      path: `.augment/skills/${skill.name}/SKILL.md`,
      content: render(AUGMENT_SKILL_TEMPLATE, context),
      description: `Augment Code skill: ${skill.name}`,
    };
  }
}
