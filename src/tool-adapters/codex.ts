import type { ToolAdapter, ToolAdapterContext, GeneratedFile, SkillContent } from "./types.js";
import { render, type TemplateContext } from "../template/engine.js";
import { CODEX_CONFIG_TOML_TEMPLATE, CODEX_SKILL_TEMPLATE } from "../templates/codex.js";

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
    const context: TemplateContext = {
      name: skill.name,
      description: skill.description,
      body: skill.body,
    };

    return {
      path: `.agents/skills/${skill.name}/SKILL.md`,
      content: render(CODEX_SKILL_TEMPLATE, context),
      description: `Codex skill: ${skill.name}`,
    };
  }

  private configToml(ctx: ToolAdapterContext): GeneratedFile {
    const verifyCommand = ctx.verificationChecks
      .map((c) => ctx.commands[c] ?? c)
      .join(" && ");

    const context: TemplateContext = {
      hasVerification: ctx.verificationChecks.length > 0,
      verifyCommand,
    };

    return {
      path: ".codex/config.toml",
      content: render(CODEX_CONFIG_TOML_TEMPLATE, context),
      description: "Codex CLI project configuration",
    };
  }
}
