import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { GeneratedFile } from "../tool-adapters/types.js";
import type { ParsedSkill, SkillSource } from "./parser.js";
import { hashBody, parseSkillFile } from "./parser.js";

const HARNESS_SKILL_MD = /^\.harness\/skills\/[^/]+\/SKILL\.md$/;

export function isHarnessMergeableSkillPath(relPath: string): boolean {
  const n = relPath.replace(/\\/g, "/");
  return HARNESS_SKILL_MD.test(n);
}

let cachedHarnessVersion: string | null = null;

export function getHarnessCliVersion(): string {
  if (cachedHarnessVersion) return cachedHarnessVersion;
  try {
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "../../package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string };
    cachedHarnessVersion = typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    cachedHarnessVersion = "0.0.0";
  }
  return cachedHarnessVersion;
}

function resolvedSource(file: GeneratedFile, parsed: ParsedSkill): SkillSource {
  if (file.harnessSkillSource) return file.harnessSkillSource;
  if (
    parsed.source === "preset" ||
    parsed.source === "static-analysis" ||
    parsed.source === "ai-extraction" ||
    parsed.source === "manual"
  ) {
    if (parsed.source !== "manual") return parsed.source;
  }
  return "static-analysis";
}

export function buildParsedSkillForMerge(file: GeneratedFile): ParsedSkill {
  const p = parseSkillFile(file.content);
  const source = resolvedSource(file, p);
  const version = p.version > 0 ? p.version : 1;
  const today = new Date().toISOString().slice(0, 10);
  return {
    name: p.name,
    description: p.description,
    version,
    source,
    generatedAt: p.generatedAt ?? today,
    harnessVersion: p.harnessVersion ?? getHarnessCliVersion(),
    body: p.body,
    bodyHash: hashBody(p.body),
  };
}
