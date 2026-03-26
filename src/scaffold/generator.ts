import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { GeneratedFile } from "../tool-adapters/types.js";

export interface GenerateResult {
  created: string[];
  skipped: string[];
}

export async function generateFiles(
  cwd: string,
  files: GeneratedFile[],
  options?: { overwrite?: boolean },
): Promise<GenerateResult> {
  const created: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const absPath = resolve(cwd, file.path);
    if (existsSync(absPath) && !options?.overwrite) {
      skipped.push(file.path);
      continue;
    }
    await mkdir(dirname(absPath), { recursive: true });
    await writeFile(absPath, file.content, "utf-8");
    created.push(file.path);
  }

  return { created, skipped };
}
