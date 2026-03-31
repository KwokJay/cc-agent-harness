import type { ToolAdapter, ToolAdapterContext, GeneratedFile, SkillContent, ToolCapability } from "./types.js";
import { render, type TemplateContext } from "../template/engine.js";
import { buildProjectRuleContext } from "./shared.js";
import { WINDSURF_RULES_TEMPLATE, WINDSURF_SKILL_TEMPLATE } from "../templates/windsurf.js";

export class WindsurfAdapter implements ToolAdapter {
  id = "windsurf" as const;
  label = "Windsurf";
  setupSummary = ".windsurf/rules/ ready";
  readonly capability: ToolCapability = {
    tier: "baseline",
    generation: true,
    diagnose: false,
    mcp: false,
    extractionAuto: false,
    extractionManualFallback: true,
  };

  generate(ctx: ToolAdapterContext): GeneratedFile[] {
    const files = [this.rulesFile(ctx)];
    for (const skill of ctx.skillContents) {
      files.push(this.skillFile(skill));
    }
    return files;
  }

  private rulesFile(ctx: ToolAdapterContext): GeneratedFile {
    const context: TemplateContext = buildProjectRuleContext(ctx);

    return {
      path: ".windsurf/rules/project.md",
      content: render(WINDSURF_RULES_TEMPLATE, context),
      description: "Windsurf project rules",
    };
  }

  private skillFile(skill: SkillContent): GeneratedFile {
    const context: TemplateContext = {
      name: skill.name,
      body: skill.body,
    };

    return {
      path: `.windsurf/rules/skill-${skill.name}.md`,
      content: render(WINDSURF_SKILL_TEMPLATE, context),
      description: `Windsurf skill rule: ${skill.name}`,
    };
  }
}
