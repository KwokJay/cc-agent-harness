import type { ToolAdapter, ToolAdapterContext, GeneratedFile, SkillContent } from "./types.js";
import { getDocsConstraintParagraph } from "../docs-scaffold/generator.js";
import { getChangelogConstraintParagraph } from "../changelog/generator.js";

export class ClaudeCodeAdapter implements ToolAdapter {
  id = "claude-code" as const;
  label = "Claude Code";

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
    const content = [
      `---`,
      `name: ${skill.name}`,
      `description: ${skill.description}`,
      `---`,
      ``,
      skill.body,
      ``,
    ].join("\n");

    return {
      path: `.claude/skills/${skill.name}/SKILL.md`,
      content,
      description: `Claude Code skill: ${skill.name}`,
    };
  }

  private claudeMd(ctx: ToolAdapterContext): GeneratedFile {
    const lines = [
      `# ${ctx.projectName}`,
      ``,
      `Read @AGENTS.md for full project instructions, coding guidelines, and verification protocol.`,
      ``,
      `## Quick Reference`,
      ``,
      `- **Type**: ${ctx.project.type}`,
      `- **Language**: ${ctx.project.language}`,
      ctx.project.framework ? `- **Framework**: ${ctx.project.framework}` : null,
      ``,
    ];

    if (ctx.customRules.length > 0) {
      lines.push(`## Project Rules`);
      lines.push(``);
      for (const rule of ctx.customRules) {
        lines.push(`- ${rule}`);
      }
      lines.push(``);
    }

    if (ctx.verificationChecks.length > 0) {
      lines.push(`## Before Completing Any Task`);
      lines.push(``);
      for (const check of ctx.verificationChecks) {
        const cmd = ctx.commands[check];
        lines.push(`- Run \`${cmd ?? check}\``);
      }
      lines.push(``);
    }

    lines.push(getDocsConstraintParagraph());
    lines.push(getChangelogConstraintParagraph());

    return {
      path: "CLAUDE.md",
      content: lines.filter((l) => l !== null).join("\n"),
      description: "Claude Code project instructions (imports AGENTS.md)",
    };
  }

  private verifyCommand(ctx: ToolAdapterContext): GeneratedFile {
    const checks = ctx.verificationChecks
      .map((c) => ctx.commands[c] ?? c)
      .join(" && ");

    const lines = [
      `Run the project verification pipeline:`,
      ``,
      `\`\`\`shell`,
      checks,
      `\`\`\``,
      ``,
      `Report the results of each step.`,
    ];

    return {
      path: ".claude/commands/verify.md",
      content: lines.join("\n") + "\n",
      description: "Claude Code /project:verify command",
    };
  }
}
