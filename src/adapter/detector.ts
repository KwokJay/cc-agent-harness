import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ProjectAdapter } from "./interface.js";
import { AdapterRegistry } from "./registry.js";

const defaultRegistry = new AdapterRegistry();

export async function detectProjectType(
  cwd: string,
): Promise<ProjectAdapter | null> {
  return defaultRegistry.detect(cwd);
}

export function detectLanguage(cwd: string): "rust" | "typescript" | "python" | "multi" {
  const signals = {
    rust: existsSync(join(cwd, "Cargo.toml")),
    typescript:
      existsSync(join(cwd, "package.json")) ||
      existsSync(join(cwd, "tsconfig.json")),
    python:
      existsSync(join(cwd, "pyproject.toml")) ||
      existsSync(join(cwd, "setup.py")) ||
      existsSync(join(cwd, "requirements.txt")),
  };

  const detected = Object.entries(signals).filter(([, v]) => v);
  if (detected.length > 1) return "multi";
  if (detected.length === 1) return detected[0][0] as "rust" | "typescript" | "python";
  return "typescript";
}
