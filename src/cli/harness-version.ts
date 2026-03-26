import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Package version for CLI `--version`, verify state, and generated files.
 * Walks up from this module until it finds this package's `package.json`.
 */
export function getHarnessVersion(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { name?: string; version?: string };
        if (pkg.name === "cc-agent-harness" && typeof pkg.version === "string") {
          return pkg.version;
        }
      } catch {
        /* continue */
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return "0.0.0";
}
