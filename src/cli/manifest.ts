import { buildManifest } from "../manifest/build.js";
import { getHarnessManifestPath, writeManifestFile } from "../manifest/write.js";

export interface ManifestCliOptions {
  /** Print manifest JSON to stdout after writing. */
  json?: boolean;
}

export async function runManifest(opts: ManifestCliOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const r = buildManifest(cwd);
  if (!r.ok) {
    console.error("manifest: invalid or missing .harness/config.yaml");
    for (const e of r.errors) console.error(`  ${e}`);
    process.exitCode = 1;
    return;
  }

  writeManifestFile(cwd, r.manifest);

  if (opts.json) {
    console.log(JSON.stringify(r.manifest, null, 2));
  } else {
    console.log(`Wrote ${getHarnessManifestPath(cwd)}`);
  }
}
