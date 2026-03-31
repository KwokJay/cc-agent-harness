import type { ToolAdapter, ToolAdapterContext, GeneratedFile, SkillContent, ToolCapability } from "./types.js";
import { render, type TemplateContext } from "../template/engine.js";
import { buildProjectRuleContext } from "./shared.js";
import { AUGMENT_GUIDELINES_TEMPLATE, AUGMENT_SKILL_TEMPLATE } from "../templates/augment.js";

export class AugmentAdapter implements ToolAdapter {
  id = "augment" as const;
  label = "Augment Code";
  setupSummary = "augment-guidelines.md + .augment/skills/ ready";
  readonly capability: ToolCapability = {
    tier: "baseline",
    generation: true,
    diagnose: false,
    mcp: false,
    extractionAuto: false,
    extractionManualFallback: true,
  };

  generate(ctx: ToolAdapterContext): GeneratedFile[] {
    const files = [this.guidelinesFile(ctx)];
    for (const skill of ctx.skillContents) {
      files.push(this.skillFile(skill));
    }
    return files;
  }

  private guidelinesFile(ctx: ToolAdapterContext): GeneratedFile {
    const context: TemplateContext = buildProjectRuleContext(ctx);

    return {
      path: "augment-guidelines.md",
      content: render(AUGMENT_GUIDELINES_TEMPLATE, context),
      description: "Augment Code project guidelines",
    };
  }

  private skillFile(skill: SkillContent): GeneratedFile {
    const context: TemplateContext = {
      name: skill.name,
      description: skill.description,
      body: skill.body,
    };

    return {
      path: `.augment/skills/${skill.name}/SKILL.md`,
      content: render(AUGMENT_SKILL_TEMPLATE, context),
      description: `Augment Code skill: ${skill.name}`,
    };
  }
}
