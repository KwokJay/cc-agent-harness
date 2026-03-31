import type { ToolAdapter, ToolAdapterContext, GeneratedFile, SkillContent, ToolCapability } from "./types.js";
import { render, type TemplateContext } from "../template/engine.js";
import { buildProjectRuleContext } from "./shared.js";
import {
  COPILOT_INSTRUCTIONS_TEMPLATE,
  COPILOT_SKILL_TEMPLATE,
} from "../templates/copilot.js";

export class CopilotAdapter implements ToolAdapter {
  id = "copilot" as const;
  label = "GitHub Copilot";
  setupSummary = ".github/copilot-instructions.md ready";
  readonly capability: ToolCapability = {
    tier: "baseline",
    generation: true,
    diagnose: false,
    mcp: false,
    extractionAuto: false,
    extractionManualFallback: true,
  };

  generate(ctx: ToolAdapterContext): GeneratedFile[] {
    const files = [this.instructions(ctx)];

    for (const skill of ctx.skillContents) {
      files.push(this.skillInstruction(skill));
    }

    return files;
  }

  private skillInstruction(skill: SkillContent): GeneratedFile {
    const context: TemplateContext = { body: skill.body };

    return {
      path: `.github/instructions/${skill.name}.instructions.md`,
      content: render(COPILOT_SKILL_TEMPLATE, context),
      description: `Copilot path instruction: ${skill.name}`,
    };
  }

  private instructions(ctx: ToolAdapterContext): GeneratedFile {
    const context: TemplateContext = buildProjectRuleContext(ctx);

    return {
      path: ".github/copilot-instructions.md",
      content: render(COPILOT_INSTRUCTIONS_TEMPLATE, context),
      description: "GitHub Copilot repository-level instructions",
    };
  }
}
