import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir } from "node:os";
import { parse as parseYaml } from "yaml";
import { harnessConfigSchema, type HarnessConfig } from "./schema.js";

export type { HarnessConfig };

const PROJECT_CONFIG_PATH = ".harness/harness.config.yaml";
const USER_CONFIG_PATH = ".harness/config.yaml";

async function readYamlFile(path: string): Promise<Record<string, unknown> | null> {
  if (!existsSync(path)) return null;
  const content = await readFile(path, "utf-8");
  return (parseYaml(content) as Record<string, unknown>) ?? null;
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    const bVal = base[key];
    const oVal = override[key];
    if (
      bVal &&
      oVal &&
      typeof bVal === "object" &&
      typeof oVal === "object" &&
      !Array.isArray(bVal) &&
      !Array.isArray(oVal)
    ) {
      result[key] = deepMerge(
        bVal as Record<string, unknown>,
        oVal as Record<string, unknown>,
      );
    } else {
      result[key] = oVal;
    }
  }
  return result;
}

export interface LoadConfigOptions {
  cwd?: string;
}

/**
 * Load harness configuration with three-layer merge:
 * 1. Built-in defaults (lowest priority)
 * 2. User-level (~/.harness/config.yaml)
 * 3. Project-level (.harness/harness.config.yaml) (highest priority)
 */
export async function loadConfig(opts?: LoadConfigOptions): Promise<HarnessConfig> {
  const cwd = opts?.cwd ?? process.cwd();

  const projectPath = resolve(cwd, PROJECT_CONFIG_PATH);
  const userPath = join(homedir(), USER_CONFIG_PATH);

  const userConfig = await readYamlFile(userPath);
  const projectConfig = await readYamlFile(projectPath);

  let merged: Record<string, unknown> = {};
  if (userConfig) merged = deepMerge(merged, userConfig);
  if (projectConfig) merged = deepMerge(merged, projectConfig);

  return harnessConfigSchema.parse(merged);
}

export function configExists(cwd?: string): boolean {
  const dir = cwd ?? process.cwd();
  return existsSync(resolve(dir, PROJECT_CONFIG_PATH));
}
