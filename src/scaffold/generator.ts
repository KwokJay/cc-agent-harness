import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { GeneratedFile } from "../tool-adapters/types.js";
import { mergeSkill, type MergeStrategy } from "../skill-extraction/merger.js";
import { parseSkillFile } from "../skill-extraction/parser.js";
import { buildParsedSkillForMerge, isHarnessMergeableSkillPath } from "../skill-extraction/skill-build.js";

export interface GenerateResult {
  created: string[];
  skipped: string[];
  updated: string[];
  unchanged: string[];
  mergeSkipped: string[];
  mergeApplied: string[];
  mergeReasons: Record<string, string>;
}

export interface GenerateOptions {
  overwrite?: boolean;
  mode?: "full" | "incremental";
  dryRun?: boolean;
  mergeStrategy?: MergeStrategy;
}

export async function generateFiles(
  cwd: string,
  files: GeneratedFile[],
  options?: GenerateOptions,
): Promise<GenerateResult> {
  const created: string[] = [];
  const skipped: string[] = [];
  const updated: string[] = [];
  const unchanged: string[] = [];
  const mergeSkipped: string[] = [];
  const mergeApplied: string[] = [];
  const mergeReasons: Record<string, string> = {};

  const mode = options?.mode ?? "full";
  const dryRun = options?.dryRun ?? false;
  const mergeStrategy: MergeStrategy =
    options?.mergeStrategy ?? (options?.overwrite ? "overwrite" : "keep-manual");

  for (const file of files) {
    const absPath = resolve(cwd, file.path);
    const exists = existsSync(absPath);

    let contentToWrite = file.content;
    let mergeResolved = false;

    if (isHarnessMergeableSkillPath(file.path)) {
      let existingParsed = null;
      if (exists) {
        try {
          existingParsed = parseSkillFile(readFileSync(absPath, "utf-8"));
        } catch { /* unreadable */ }
      }
      const generatedParsed = buildParsedSkillForMerge(file);
      const decision = mergeSkill(existingParsed, generatedParsed, mergeStrategy);
      mergeReasons[file.path] = decision.reason;

      if (decision.action === "skip") {
        mergeSkipped.push(file.path);
        unchanged.push(file.path);
        continue;
      }

      mergeResolved = true;
      mergeApplied.push(file.path);
      contentToWrite = decision.content;
    }

    if (mode === "incremental" && exists) {
      try {
        const existing = readFileSync(absPath, "utf-8");
        if (existing === contentToWrite) {
          unchanged.push(file.path);
          continue;
        }
      } catch { /* treat as needing update */ }

      if (!dryRun) {
        await mkdir(dirname(absPath), { recursive: true });
        await writeFile(absPath, contentToWrite, "utf-8");
      }
      updated.push(file.path);
      continue;
    }

    if (exists && !options?.overwrite && !mergeResolved) {
      skipped.push(file.path);
      continue;
    }

    if (!dryRun) {
      await mkdir(dirname(absPath), { recursive: true });
      await writeFile(absPath, contentToWrite, "utf-8");
    }
    created.push(file.path);
  }

  return { created, skipped, updated, unchanged, mergeSkipped, mergeApplied, mergeReasons };
}
