import { buildManifest } from "./build.js";
import { writeManifestFile } from "./write.js";

export function refreshHarnessManifest(cwd: string): { ok: true } | { ok: false; errors: string[] } {
  const r = buildManifest(cwd);
  if (!r.ok) return { ok: false, errors: r.errors };
  writeManifestFile(cwd, r.manifest);
  return { ok: true };
}
