import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

export interface SkillValidationResult {
  valid: boolean;
  name: string | null;
  description: string | null;
  errors: string[];
  warnings: string[];
}

export async function validateSkill(skillDir: string): Promise<SkillValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let name: string | null = null;
  let description: string | null = null;

  const skillMdPath = join(skillDir, "SKILL.md");
  if (!existsSync(skillMdPath)) {
    errors.push("Missing SKILL.md");
    return { valid: false, name, description, errors, warnings };
  }

  const content = await readFile(skillMdPath, "utf-8");
  const frontmatter = extractFrontmatter(content);

  if (!frontmatter) {
    errors.push("SKILL.md missing YAML frontmatter (---...--- block)");
    return { valid: false, name, description, errors, warnings };
  }

  name = frontmatter.name ?? null;
  description = frontmatter.description ?? null;

  if (!name) errors.push("Frontmatter missing required 'name' field");
  if (!description) errors.push("Frontmatter missing required 'description' field");

  const agentsYaml = join(skillDir, "agents", "openai.yaml");
  if (!existsSync(agentsYaml)) {
    warnings.push("No agents/openai.yaml (recommended for UI metadata)");
  }

  return { valid: errors.length === 0, name, description, errors, warnings };
}

function extractFrontmatter(
  content: string,
): Record<string, string> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fields: Record<string, string> = {};
  const lines = match[1].split("\n");
  let currentKey: string | null = null;
  let currentValue = "";

  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (kvMatch) {
      if (currentKey) fields[currentKey] = currentValue.trim();
      currentKey = kvMatch[1];
      currentValue = kvMatch[2];
    } else if (currentKey && (line.startsWith("  ") || line.startsWith("\t"))) {
      currentValue += " " + line.trim();
    }
  }
  if (currentKey) fields[currentKey] = currentValue.trim();

  return fields;
}
