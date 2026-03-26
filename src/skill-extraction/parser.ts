import { createHash } from "node:crypto";

export type SkillSource = "preset" | "static-analysis" | "ai-extraction" | "manual";

export interface ParsedSkill {
  name: string;
  description: string;
  version: number;
  source: SkillSource;
  generatedAt?: string;
  harnessVersion?: string;
  body: string;
  bodyHash: string;
}

export function parseSkillFile(content: string): ParsedSkill {
  const { frontmatter, body } = splitFrontmatter(content);

  const storedHash =
    typeof frontmatter.body_hash === "string" && frontmatter.body_hash.length > 0
      ? frontmatter.body_hash
      : undefined;

  return {
    name: (frontmatter.name as string) ?? "unknown",
    description: (frontmatter.description as string) ?? "",
    version: typeof frontmatter.version === "number" ? frontmatter.version : 0,
    source: isValidSource(frontmatter.source) ? frontmatter.source : "manual",
    generatedAt: frontmatter.generated_at as string | undefined,
    harnessVersion: frontmatter.harness_version as string | undefined,
    body,
    bodyHash: storedHash ?? hashBody(body),
  };
}

export function serializeSkill(skill: ParsedSkill): string {
  const lines = [
    "---",
    `name: ${skill.name}`,
    `description: ${skill.description}`,
    `version: ${skill.version}`,
    `source: ${skill.source}`,
  ];

  if (skill.generatedAt) {
    lines.push(`generated_at: ${skill.generatedAt}`);
  }
  if (skill.harnessVersion) {
    lines.push(`harness_version: ${skill.harnessVersion}`);
  }

  lines.push(`body_hash: ${hashBody(skill.body)}`);

  lines.push("---", "", skill.body, "");

  return lines.join("\n");
}

export function hashBody(body: string): string {
  return createHash("sha256").update(body.trim()).digest("hex").slice(0, 16);
}

function splitFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const trimmed = content.trim();
  if (!trimmed.startsWith("---")) {
    return { frontmatter: {}, body: trimmed };
  }

  const endIdx = trimmed.indexOf("---", 3);
  if (endIdx === -1) {
    return { frontmatter: {}, body: trimmed };
  }

  const fmBlock = trimmed.slice(3, endIdx).trim();
  const body = trimmed.slice(endIdx + 3).trim();

  const frontmatter: Record<string, unknown> = {};
  for (const line of fmBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const rawVal = line.slice(colonIdx + 1).trim();

    if (rawVal === "") continue;
    if (/^\d+$/.test(rawVal)) {
      frontmatter[key] = parseInt(rawVal, 10);
    } else {
      frontmatter[key] = rawVal;
    }
  }

  return { frontmatter, body };
}

function isValidSource(val: unknown): val is SkillSource {
  return typeof val === "string" &&
    ["preset", "static-analysis", "ai-extraction", "manual"].includes(val);
}
