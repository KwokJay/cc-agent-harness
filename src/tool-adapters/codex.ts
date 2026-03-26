import type { ToolAdapter, ToolAdapterContext, GeneratedFile, SkillContent } from "./types.js";

export class CodexAdapter implements ToolAdapter {
  id = "codex" as const;
  label = "OpenAI Codex";

  generate(ctx: ToolAdapterContext): GeneratedFile[] {
    const files: GeneratedFile[] = [this.configToml(ctx)];

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
      path: `.agents/skills/${skill.name}/SKILL.md`,
      content,
      description: `Codex skill: ${skill.name}`,
    };
  }

  private configToml(ctx: ToolAdapterContext): GeneratedFile {
    const lines = [
      `# Codex project configuration`,
      `# See https://developers.openai.com/codex/config-reference`,
      ``,
    ];

    if (ctx.verificationChecks.length > 0) {
      const verifyCmd = ctx.verificationChecks
        .map((c) => ctx.commands[c] ?? c)
        .join(" && ");
      lines.push(`# Run verification after changes`);
      lines.push(`developer_instructions = "After making changes, always run: ${verifyCmd}"`);
      lines.push(``);
    }

    return {
      path: ".codex/config.toml",
      content: lines.join("\n"),
      description: "Codex CLI project configuration",
    };
  }
}
