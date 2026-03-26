import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GeneratedFile } from "../tool-adapters/types.js";

export interface DiffResult {
  unchanged: string[];
  modified: string[];
  added: string[];
  removed: string[];
}

export function diffPlan(
  cwd: string,
  newFiles: GeneratedFile[],
  previousFiles?: string[],
): DiffResult {
  const unchanged: string[] = [];
  const modified: string[] = [];
  const added: string[] = [];

  const newPaths = new Set<string>();

  for (const file of newFiles) {
    newPaths.add(file.path);
    const absPath = resolve(cwd, file.path);

    if (!existsSync(absPath)) {
      added.push(file.path);
      continue;
    }

    try {
      const existing = readFileSync(absPath, "utf-8");
      if (existing === file.content) {
        unchanged.push(file.path);
      } else {
        modified.push(file.path);
      }
    } catch {
      added.push(file.path);
    }
  }

  const removed: string[] = [];
  if (previousFiles) {
    for (const prev of previousFiles) {
      if (!newPaths.has(prev)) {
        removed.push(prev);
      }
    }
  }

  return { unchanged, modified, added, removed };
}
