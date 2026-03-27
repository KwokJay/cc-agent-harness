import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { HarnessManifest } from "./types.js";

const MANIFEST_REL = ".harness/manifest.json";

export function getHarnessManifestPath(cwd: string): string {
  return resolve(cwd, MANIFEST_REL);
}

/**
 * Write `.harness/manifest.json` (creates `.harness` if needed).
 */
export function writeManifestFile(cwd: string, manifest: HarnessManifest): void {
  const dir = resolve(cwd, ".harness");
  mkdirSync(dir, { recursive: true });
  const path = resolve(cwd, MANIFEST_REL);
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");
}
