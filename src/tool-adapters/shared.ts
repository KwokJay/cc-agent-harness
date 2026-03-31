import type { ToolAdapterContext } from "./types.js";
import type { TemplateContext } from "../template/engine.js";
import { getDocsConstraintParagraph } from "../docs-scaffold/generator.js";
import { getChangelogConstraintParagraph } from "../changelog/generator.js";

/** Pattern A: backtick-wrapped verification lines (cursor, copilot, windsurf, trae, augment) */
export function buildBacktickVerificationLines(ctx: ToolAdapterContext): string[] {
  return ctx.verificationChecks.map((c) => {
    const cmd = ctx.commands[c];
    return `\`${cmd ?? c}\``;
  });
}

/** Claude-code variant with "Run " prefix */
export function buildClaudeVerificationLines(ctx: ToolAdapterContext): string[] {
  return ctx.verificationChecks.map((c) => {
    const cmd = ctx.commands[c];
    return `Run \`${cmd ?? c}\``;
  });
}

/** Pattern B: &&-joined verify command (claude-code, codex, opencode) */
export function buildVerifyCommand(ctx: ToolAdapterContext): string {
  return ctx.verificationChecks
    .map((c) => ctx.commands[c] ?? c)
    .join(" && ");
}

/** Common project rule context (cursor, copilot, windsurf, trae, augment) */
export function buildProjectRuleContext(ctx: ToolAdapterContext): TemplateContext {
  return {
    projectName: ctx.projectName,
    project: {
      type: ctx.project.type,
      language: ctx.project.language,
      framework: ctx.project.framework,
    },
    customRules: ctx.customRules,
    verificationLines: buildBacktickVerificationLines(ctx),
    docsConstraint: getDocsConstraintParagraph(),
    changelogConstraint: getChangelogConstraintParagraph(),
  };
}
