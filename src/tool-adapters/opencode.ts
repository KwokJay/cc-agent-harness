import type { ToolAdapter, ToolAdapterContext, GeneratedFile, SkillContent } from "./types.js";
import { render, type TemplateContext } from "../template/engine.js";
import { OPENCODE_SKILL_TEMPLATE } from "../templates/opencode.js";

export class OpenCodeAdapter implements ToolAdapter {
  id = "opencode" as const;
  label = "OpenCode";

  generate(ctx: ToolAdapterContext): GeneratedFile[] {
    const files: GeneratedFile[] = [this.configJson(ctx)];

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
      path: `.opencode/skills/${skill.name}/SKILL.md`,
      content: render(OPENCODE_SKILL_TEMPLATE, context),
      description: `OpenCode skill: ${skill.name}`,
    };
  }

  private configJson(ctx: ToolAdapterContext): GeneratedFile {
    const config: Record<string, unknown> = {
      $schema: "https://opencode.ai/config-schema.json",
      project: ctx.projectName,
    };

    if (ctx.verificationChecks.length > 0) {
      const verifyCmd = ctx.verificationChecks
        .map((c) => ctx.commands[c] ?? c)
        .join(" && ");
      config.instructions = `After making changes, always run: ${verifyCmd}`;
    }

    return {
      path: "opencode.json",
      content: JSON.stringify(config, null, 2) + "\n",
      description: "OpenCode project configuration",
    };
  }
}
