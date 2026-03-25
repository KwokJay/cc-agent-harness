import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir } from "node:os";
import { parse as parseYaml } from "yaml";
import { harnessConfigSchema, type HarnessConfig } from "./schema.js";

export type { HarnessConfig };

const PROJECT_CONFIG_PATH = ".harness/harness.config.yaml";
const USER_CONFIG_PATH = ".harness/config.yaml";

export interface ConfigLayer {
  name: string;
  path: string;
  data: Record<string, unknown> | null;
}

export interface LoadConfigOptions {
  cwd?: string;
  extraLayers?: ConfigLayer[];
}

export interface LoadConfigResult {
  config: HarnessConfig;
  layers: ConfigLayer[];
}

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

/**
 * Load harness configuration with N-layer merge and source tracking.
 *
 * Default layer order (lowest to highest priority):
 * 1. Built-in defaults (via Zod schema defaults)
 * 2. User-level (~/.harness/config.yaml)
 * 3. Project-level (.harness/harness.config.yaml)
 * 4. Extra layers (programmatic overrides)
 */
export async function loadConfig(opts?: LoadConfigOptions): Promise<HarnessConfig> {
  const result = await loadConfigWithLayers(opts);
  return result.config;
}

export async function loadConfigWithLayers(opts?: LoadConfigOptions): Promise<LoadConfigResult> {
  const cwd = opts?.cwd ?? process.cwd();

  const layers: ConfigLayer[] = [];

  const userPath = join(homedir(), USER_CONFIG_PATH);
  const userData = await readYamlFile(userPath);
  layers.push({ name: "user", path: userPath, data: userData });

  const projectPath = resolve(cwd, PROJECT_CONFIG_PATH);
  const projectData = await readYamlFile(projectPath);
  layers.push({ name: "project", path: projectPath, data: projectData });

  if (opts?.extraLayers) {
    layers.push(...opts.extraLayers);
  }

  let merged: Record<string, unknown> = {};
  for (const layer of layers) {
    if (layer.data) {
      merged = deepMerge(merged, layer.data);
    }
  }

  const config = harnessConfigSchema.parse(merged);
  return { config, layers };
}

export function configExists(cwd?: string): boolean {
  return anyConfigExists(cwd);
}

export function projectConfigExists(cwd?: string): boolean {
  const dir = cwd ?? process.cwd();
  return existsSync(resolve(dir, PROJECT_CONFIG_PATH));
}

export function userConfigExists(): boolean {
  return existsSync(join(homedir(), USER_CONFIG_PATH));
}

export function anyConfigExists(cwd?: string): boolean {
  return projectConfigExists(cwd) || userConfigExists();
}
