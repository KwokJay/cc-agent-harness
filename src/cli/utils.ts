import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function getTemplatesDir(): string {
  const thisFile = fileURLToPath(import.meta.url);
  const thisDir = dirname(thisFile);

  // tsup bundles all code into dist/, so import.meta.url points there.
  // Templates live at <package-root>/templates/, which is one level up from dist/.
  if (thisDir.endsWith("/dist") || thisDir.endsWith("\\dist")) {
    return join(thisDir, "..", "templates");
  }

  // Running from source (e.g. tests): src/cli/ -> ../../templates
  return join(thisDir, "..", "..", "templates");
}
