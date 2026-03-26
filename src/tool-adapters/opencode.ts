import type { ToolAdapter, ToolAdapterContext, GeneratedFile } from "./types.js";

export class OpenCodeAdapter implements ToolAdapter {
  id = "opencode" as const;
  label = "OpenCode";

  generate(ctx: ToolAdapterContext): GeneratedFile[] {
    return [this.configJson(ctx)];
  }

  private configJson(ctx: ToolAdapterContext): GeneratedFile {
    const config: Record<string, unknown> = {
      $schema: "https://opencode.ai/config-schema.json",
    };

    const instructions: string[] = [];
    if (ctx.skills.length > 0) {
      instructions.push(...ctx.skills.map((s) => `.harness/skills/${s}/SKILL.md`));
    }
    if (instructions.length > 0) {
      config.instructions = instructions;
    }

    return {
      path: "opencode.json",
      content: JSON.stringify(config, null, 2) + "\n",
      description: "OpenCode project configuration",
    };
  }
}
