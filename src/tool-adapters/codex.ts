import type { ToolAdapter, ToolAdapterContext, GeneratedFile } from "./types.js";

export class CodexAdapter implements ToolAdapter {
  id = "codex" as const;
  label = "OpenAI Codex";

  generate(ctx: ToolAdapterContext): GeneratedFile[] {
    const lines = [
      `# Codex project configuration`,
      `# See https://developers.openai.com/codex/config-reference`,
      ``,
    ];

    if (ctx.skillContents.length > 0) {
      const fallbacks = ctx.skillContents.map((s) => `.harness/skills/${s.name}/SKILL.md`);
      lines.push(`# Skill files (Codex reads AGENTS.md natively; these are fallback references)`);
      lines.push(`project_doc_fallback_filenames = [${fallbacks.map((f) => `"${f}"`).join(", ")}]`);
      lines.push(``);
    }

    if (ctx.verificationChecks.length > 0) {
      const verifyCmd = ctx.verificationChecks
        .map((c) => ctx.commands[c] ?? c)
        .join(" && ");
      lines.push(`# Run verification after changes`);
      lines.push(`developer_instructions = "After making changes, always run: ${verifyCmd}"`);
      lines.push(``);
    }

    return [{
      path: ".codex/config.toml",
      content: lines.join("\n"),
      description: "Codex CLI project configuration",
    }];
  }
}
