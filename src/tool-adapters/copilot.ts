import type { ToolAdapter, ToolAdapterContext, GeneratedFile } from "./types.js";

export class CopilotAdapter implements ToolAdapter {
  id = "copilot" as const;
  label = "GitHub Copilot";

  generate(ctx: ToolAdapterContext): GeneratedFile[] {
    const files = [this.instructions(ctx)];
    for (const skill of ctx.skillContents) {
      files.push({
        path: `.github/instructions/skill-${skill.name}.instructions.md`,
        content: `---\napplyTo: "**"\n---\n\n${skill.body}\n`,
        description: `Copilot skill instruction: ${skill.name}`,
      });
    }
    return files;
  }

  private instructions(ctx: ToolAdapterContext): GeneratedFile {
    const lines = [
      `# Copilot Instructions for ${ctx.projectName}`,
      ``,
      `## Project`,
      ``,
      `- **Type**: ${ctx.project.type}`,
      `- **Language**: ${ctx.project.language}`,
      ctx.project.framework ? `- **Framework**: ${ctx.project.framework}` : null,
      ``,
      `## Coding Guidelines`,
      ``,
      ...ctx.customRules.map((r) => `- ${r}`),
      ``,
      `## Verification`,
      ``,
      `Before finalizing changes, ensure the following checks pass:`,
      ``,
      ...ctx.verificationChecks.map((c) => {
        const cmd = ctx.commands[c];
        return `- \`${cmd ?? c}\``;
      }),
      ``,
      `## Additional Context`,
      ``,
      `See AGENTS.md in the repository root for complete project instructions.`,
    ];

    return {
      path: ".github/copilot-instructions.md",
      content: lines.filter((l) => l !== null).join("\n") + "\n",
      description: "GitHub Copilot repository-level instructions",
    };
  }
}
