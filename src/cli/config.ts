import { loadConfigWithLayers, configExists } from "../config/loader.js";
import { stringify as yamlStringify } from "yaml";

export async function runConfigShow(): Promise<void> {
  const cwd = process.cwd();

  if (!configExists(cwd)) {
    console.log("No harness configuration found. Run `agent-harness setup` first.");
    return;
  }

  const result = await loadConfigWithLayers({ cwd });

  console.log("Configuration layers:\n");
  for (const layer of result.layers) {
    const status = layer.data ? "loaded" : "not found";
    console.log(`  [${layer.name}] ${layer.path} — ${status}`);
  }

  console.log("\nMerged configuration:\n");
  console.log(yamlStringify(result.config));
}

export async function runConfigValidate(): Promise<void> {
  const cwd = process.cwd();

  if (!configExists(cwd)) {
    console.log("[FAIL] No configuration file found at .harness/harness.config.yaml");
    process.exitCode = 1;
    return;
  }

  try {
    const result = await loadConfigWithLayers({ cwd });
    const loadedLayers = result.layers.filter((l) => l.data);
    console.log(`[PASS] Configuration is valid (${loadedLayers.length} layer(s) loaded).`);
  } catch (err) {
    console.log("[FAIL] Configuration validation failed:");
    console.log(`  ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}
