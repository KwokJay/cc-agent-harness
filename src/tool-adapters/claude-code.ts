import type { ToolAdapter, ToolAdapterContext, GeneratedFile, SkillContent } from "./types.js";
import { TOOL_CAPABILITIES } from "./types.js";
import { getDocsConstraintParagraph } from "../docs-scaffold/generator.js";
import { getChangelogConstraintParagraph } from "../changelog/generator.js";
import { render, type TemplateContext } from "../template/engine.js";
import {
  CLAUDE_MD_TEMPLATE,
  CLAUDE_VERIFY_COMMAND_TEMPLATE,
  CLAUDE_SKILL_TEMPLATE,
} from "../templates/claude-code.js";

export class ClaudeCodeAdapter implements ToolAdapter {
  id = "claude-code" as const;
  label = "Claude Code";
  readonly capability = TOOL_CAPABILITIES["claude-code"];

  generate(ctx: ToolAdapterContext): GeneratedFile[] {
    const files: GeneratedFile[] = [this.claudeMd(ctx)];

    if (ctx.verificationChecks.length > 0) {
      files.push(this.verifyCommand(ctx));
    }

    for (const skill of ctx.skillContents) {
      files.push(this.skillFile(skill));
    }

    return files;
  }

  private skillFile(skill: SkillContent): GeneratedFile {
    const context: TemplateContext = {
      name: skill.name,
      description: skill.description,
      body: skill.body,
    };

    return {
      path: `.claude/skills/${skill.name}/SKILL.md`,
      content: render(CLAUDE_SKILL_TEMPLATE, context),
      description: `Claude Code skill: ${skill.name}`,
    };
  }

  private claudeMd(ctx: ToolAdapterContext): GeneratedFile {
    const verificationLines = ctx.verificationChecks.map((c) => {
      const cmd = ctx.commands[c];
      return `Run \`${cmd ?? c}\``;
    });

    const context: TemplateContext = {
      projectName: ctx.projectName,
      project: {
        type: ctx.project.type,
        language: ctx.project.language,
        framework: ctx.project.framework,
      },
      hasCustomRules: ctx.customRules.length > 0,
      customRules: ctx.customRules,
      hasVerification: ctx.verificationChecks.length > 0,
      verificationLines,
      docsConstraint: getDocsConstraintParagraph(),
      changelogConstraint: getChangelogConstraintParagraph(),
    };

    return {
      path: "CLAUDE.md",
      content: render(CLAUDE_MD_TEMPLATE, context),
      description: "Claude Code project instructions (imports AGENTS.md)",
    };
  }

  private verifyCommand(ctx: ToolAdapterContext): GeneratedFile {
    const verifyCommand = ctx.verificationChecks
      .map((c) => ctx.commands[c] ?? c)
      .join(" && ");

    const context: TemplateContext = { verifyCommand };

    return {
      path: ".claude/commands/verify.md",
      content: render(CLAUDE_VERIFY_COMMAND_TEMPLATE, context),
      description: "Claude Code /project:verify command",
    };
  }
}
