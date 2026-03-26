import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { GeneratedFile } from "../tool-adapters/types.js";

export interface GenerateResult {
  created: string[];
  skipped: string[];
  updated: string[];
  unchanged: string[];
}

export interface GenerateOptions {
  overwrite?: boolean;
  mode?: "full" | "incremental";
  dryRun?: boolean;
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

  const mode = options?.mode ?? "full";
  const dryRun = options?.dryRun ?? false;

  for (const file of files) {
    const absPath = resolve(cwd, file.path);
    const exists = existsSync(absPath);

    if (mode === "incremental" && exists) {
      try {
        const existing = readFileSync(absPath, "utf-8");
        if (existing === file.content) {
          unchanged.push(file.path);
          continue;
        }
      } catch { /* treat read errors as needing update */ }

      if (!dryRun) {
        await mkdir(dirname(absPath), { recursive: true });
        await writeFile(absPath, file.content, "utf-8");
      }
      updated.push(file.path);
      continue;
    }

    if (exists && !options?.overwrite) {
      skipped.push(file.path);
      continue;
    }

    if (!dryRun) {
      await mkdir(dirname(absPath), { recursive: true });
      await writeFile(absPath, file.content, "utf-8");
    }
    created.push(file.path);
  }

  return { created, skipped, updated, unchanged };
}
