import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { MigratePlanEntry } from "./types.js";

/**
 * Registered migrations keyed by the **from** semver (exact tag users pass to `migrate`).
 * Add entries when config paths or fields change between releases.
 */
export const migrateRegistry: Record<string, MigratePlanEntry> = {
  "0.5.0": {
    fromVersion: "0.5.0",
    patches: [
      {
        id: "add-generated-files-field",
        description: "Ensure .harness/config.yaml has a generated_files list (added in 0.6.0)",
        safe: true,
        apply(cwd: string) {
          const configPath = resolve(cwd, ".harness/config.yaml");
          if (!existsSync(configPath)) return;
          const raw = readFileSync(configPath, "utf-8");
          if (/\bgenerated_files\s*:/m.test(raw)) return;
          const sep = raw.endsWith("\n") ? "" : "\n";
          writeFileSync(configPath, `${raw}${sep}generated_files: []\n`, "utf-8");
        },
      },
    ],
  },
};

export function listRegisteredFromVersions(): string[] {
  return Object.keys(migrateRegistry).sort();
}

export function getMigrationPlan(fromVersion: string): MigratePlanEntry | undefined {
  return migrateRegistry[fromVersion];
}
