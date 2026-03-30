import type { ToolAdapter, ToolAdapterContext, GeneratedFile, SkillContent } from "./types.js";
import { TOOL_CAPABILITIES } from "./types.js";
import { getDocsConstraintParagraph } from "../docs-scaffold/generator.js";
import { getChangelogConstraintParagraph } from "../changelog/generator.js";
import { render, type TemplateContext } from "../template/engine.js";
import {
  COPILOT_INSTRUCTIONS_TEMPLATE,
  COPILOT_SKILL_TEMPLATE,
} from "../templates/copilot.js";

export class CopilotAdapter implements ToolAdapter {
  id = "copilot" as const;
  label = "GitHub Copilot";
  readonly capability = TOOL_CAPABILITIES.copilot;

  generate(ctx: ToolAdapterContext): GeneratedFile[] {
    const files = [this.instructions(ctx)];

    for (const skill of ctx.skillContents) {
      files.push(this.skillInstruction(skill));
    }

    return files;
  }

  private skillInstruction(skill: SkillContent): GeneratedFile {
    const context: TemplateContext = { body: skill.body };

    return {
      path: `.github/instructions/${skill.name}.instructions.md`,
      content: render(COPILOT_SKILL_TEMPLATE, context),
      description: `Copilot path instruction: ${skill.name}`,
    };
  }

  private instructions(ctx: ToolAdapterContext): GeneratedFile {
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
      path: ".github/copilot-instructions.md",
      content: render(COPILOT_INSTRUCTIONS_TEMPLATE, context),
      description: "GitHub Copilot repository-level instructions",
    };
  }
}
