import type { ToolAdapter, ToolAdapterContext, GeneratedFile, SkillContent } from "./types.js";

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
      path: `.opencode/skills/${skill.name}/SKILL.md`,
      content,
      description: `OpenCode skill: ${skill.name}`,
    };
  }

  private configJson(ctx: ToolAdapterContext): GeneratedFile {
    const config: Record<string, unknown> = {
      $schema: "https://opencode.ai/config-schema.json",
    };

    return {
      path: "opencode.json",
      content: JSON.stringify(config, null, 2) + "\n",
      description: "OpenCode project configuration",
    };
  }
}
