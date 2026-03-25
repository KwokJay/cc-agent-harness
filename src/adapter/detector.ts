import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ProjectAdapter } from "./interface.js";
import { RustAdapter } from "./rust.js";
import { TypeScriptAdapter } from "./typescript.js";
import { PythonAdapter } from "./python.js";

const BUILT_IN_ADAPTERS: ProjectAdapter[] = [
  new RustAdapter(),
  new TypeScriptAdapter(),
  new PythonAdapter(),
];

export async function detectProjectType(
  cwd: string,
): Promise<ProjectAdapter | null> {
  for (const adapter of BUILT_IN_ADAPTERS) {
    if (await adapter.detect(cwd)) return adapter;
  }
  return null;
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
