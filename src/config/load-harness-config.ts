import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { validateConfig, type HarnessConfig, type ValidationResult } from "./schema.js";

export interface LoadedHarnessConfig {
  config: HarnessConfig;
  configPath: string;
}

/**
 * Read and validate `.harness/config.yaml` under cwd.
 */
export function loadHarnessConfig(cwd: string): ValidationResult & { configPath: string } {
  const configPath = resolve(cwd, ".harness/config.yaml");
  if (!existsSync(configPath)) {
    return {
      valid: false,
      errors: [".harness/config.yaml not found"],
      configPath,
    };
  }

  let raw: unknown;
  try {
    raw = parseYaml(readFileSync(configPath, "utf-8"));
  } catch {
    return { valid: false, errors: ["failed to parse .harness/config.yaml"], configPath };
  }

  const validation = validateConfig(raw);
  return { ...validation, configPath };
}
