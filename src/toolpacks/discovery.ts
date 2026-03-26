import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { ToolpackPlugin } from "./plugin.js";
import type { ToolId, GeneratedFile } from "../tool-adapters/types.js";
import type { ToolpackCategory } from "./categories.js";
import { loadBuiltinToolpacks } from "./builtin/index.js";

export function discoverToolpacks(cwd: string): ToolpackPlugin[] {
  const builtin = loadBuiltinToolpacks();
  const local = loadLocalToolpacks(cwd);
  return [...builtin, ...local];
}

function loadLocalToolpacks(cwd: string): ToolpackPlugin[] {
  const localDir = join(cwd, ".harness/toolpacks");
  if (!existsSync(localDir)) return [];

  const plugins: ToolpackPlugin[] = [];

  try {
    const entries = readdirSync(localDir);
    for (const entry of entries) {
      const pluginPath = join(localDir, entry, "plugin.json");
      if (!existsSync(pluginPath)) continue;

      try {
        const raw = JSON.parse(readFileSync(pluginPath, "utf-8"));
        const plugin = parseLocalPlugin(raw, entry);
        if (plugin) plugins.push(plugin);
      } catch { /* skip invalid plugin.json */ }
    }
  } catch { /* skip if directory unreadable */ }

  return plugins;
}

function parseLocalPlugin(raw: Record<string, unknown>, dirName: string): ToolpackPlugin | null {
  if (typeof raw.id !== "string" || typeof raw.name !== "string") return null;

  return {
    id: raw.id,
    name: raw.name,
    description: (raw.description as string) ?? "",
    category: (raw.category as ToolpackCategory) ?? "engineering-support",
    version: (raw.version as string) ?? "0.0.0",
    source: "local",
    install: { type: "plugin", instructions: `Local toolpack from .harness/toolpacks/${dirName}/` },
    relevantTools: (raw.relevantTools as ToolId[]) ?? [],
    generateFiles(): GeneratedFile[] {
      return [];
    },
  };
}
