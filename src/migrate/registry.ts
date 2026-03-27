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
        id: "noop-baseline",
        description: "No automatic file changes required for 0.5.x → current; run `harn manifest` after upgrade.",
        safe: true,
        apply() {
          /* intentional no-op */
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
