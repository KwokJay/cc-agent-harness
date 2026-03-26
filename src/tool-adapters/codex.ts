import type { ToolAdapter, ToolAdapterContext, GeneratedFile } from "./types.js";

export class CodexAdapter implements ToolAdapter {
  id = "codex" as const;
  label = "OpenAI Codex";

  generate(ctx: ToolAdapterContext): GeneratedFile[] {
    return [this.configToml(ctx)];
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
