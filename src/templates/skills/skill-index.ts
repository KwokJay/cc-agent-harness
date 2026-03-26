import { render, type TemplateContext } from "../../template/engine.js";

const TEMPLATE = `# {{projectName}} - Extracted Skills Index

Auto-extracted on {{generatedDate}} by agent-harness.

{{#if technical}}
## Technical Skills

{{#each technical}}
- **{{name}}**: {{summary}}
{{/each}}
{{/if}}
{{#if business}}
## Business Skills

{{#each business}}
- **{{name}}**: {{summary}}
{{/each}}
{{/if}}
## AI-Powered Extraction

For deeper skill extraction using your AI coding tool, the harness will
automatically invoke skill-creator. See \`.harness/skills/EXTRACTION-TASK.md\`.
`;

export interface SkillIndexSkillRow {
  name: string;
  summary: string;
}

export interface SkillIndexTemplateContext {
  projectName: string;
  generatedDate: string;
  technical: SkillIndexSkillRow[];
  business: SkillIndexSkillRow[];
}

export function renderSkillIndexDoc(ctx: SkillIndexTemplateContext): string {
  return render(TEMPLATE, ctx as unknown as TemplateContext);
}
