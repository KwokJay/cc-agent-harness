import { createRequire } from "node:module";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { ToolpackPlugin } from "./plugin.js";
import type { ToolId, GeneratedFile } from "../tool-adapters/types.js";
import type { ToolpackCategory } from "./categories.js";
import { loadBuiltinToolpacks } from "./builtin/index.js";

export function discoverToolpacks(cwd: string): ToolpackPlugin[] {
  const builtin = loadBuiltinToolpacks();
  const npm = loadNpmToolpacks(cwd);
  const local = loadLocalToolpacks(cwd);
  return mergeToolpackById(builtin, npm, local);
}

function mergeToolpackById(...groups: ToolpackPlugin[][]): ToolpackPlugin[] {
  const merged: ToolpackPlugin[] = [];
  for (const group of groups) {
    for (const p of group) {
      const i = merged.findIndex((x) => x.id === p.id);
      if (i >= 0) merged[i] = p;
      else merged.push(p);
    }
  }
  return merged;
}

interface ToolpackPackageMeta {
  id: string;
  main: string;
}

function readToolpackMeta(pkgJsonPath: string): ToolpackPackageMeta | null {
  try {
    const raw = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as Record<string, unknown>;
    const ah = raw["agent-harness"] as Record<string, unknown> | undefined;
    const tp = ah?.toolpack as Record<string, unknown> | undefined;
    if (!tp || typeof tp.id !== "string" || typeof tp.main !== "string") return null;
    return { id: tp.id, main: tp.main };
  } catch {
    return null;
  }
}

function isToolpackShape(x: unknown): x is Omit<ToolpackPlugin, "source" | "npmPackage"> {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.description === "string" &&
    typeof o.category === "string" &&
    typeof o.version === "string" &&
    typeof o.generateFiles === "function"
  );
}

export function loadNpmToolpacks(cwd: string): ToolpackPlugin[] {
  const nodeModules = join(cwd, "node_modules");
  if (!existsSync(nodeModules)) return [];

  const dirs: string[] = [];

  try {
    for (const name of readdirSync(nodeModules)) {
      if (name.startsWith("agent-harness-toolpack-")) {
        dirs.push(join(nodeModules, name));
      }
    }
    const scope = join(nodeModules, "@agent-harness");
    if (existsSync(scope)) {
      for (const name of readdirSync(scope)) {
        if (name.startsWith("toolpack-")) {
          dirs.push(join(scope, name));
        }
      }
    }
  } catch {
    return [];
  }

  const plugins: ToolpackPlugin[] = [];

  for (const pkgRoot of dirs) {
    const pkgJsonPath = join(pkgRoot, "package.json");
    if (!existsSync(pkgJsonPath)) continue;
    const meta = readToolpackMeta(pkgJsonPath);
    if (!meta) continue;

    let pkgName = "";
    try {
      const pj = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as { name?: string };
      pkgName = typeof pj.name === "string" ? pj.name : "";
    } catch {
      continue;
    }

    try {
      const req = createRequire(pkgJsonPath);
      const mod = req(meta.main) as Record<string, unknown>;
      const exported = (mod?.default ?? mod?.toolpack ?? mod) as unknown;
      if (!isToolpackShape(exported)) continue;

      const ex = exported as Record<string, unknown>;
      const plugin: ToolpackPlugin = {
        id: meta.id,
        name: exported.name,
        description: exported.description,
        category: exported.category as ToolpackCategory,
        version: exported.version,
        source: "npm",
        npmPackage: pkgName || undefined,
        install: { type: "npm", package: pkgName || meta.id },
        relevantTools: Array.isArray(exported.relevantTools)
          ? (exported.relevantTools as ToolId[])
          : [],
        generateFiles: exported.generateFiles.bind(exported) as ToolpackPlugin["generateFiles"],
        ...(typeof ex.sharedPolicy === "boolean" ? { sharedPolicy: ex.sharedPolicy } : {}),
      };
      plugins.push(plugin);
    } catch {
      /* skip unloadable */
    }
  }

  return plugins;
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
    ...(typeof raw.sharedPolicy === "boolean" ? { sharedPolicy: raw.sharedPolicy } : {}),
    generateFiles(): GeneratedFile[] {
      return [];
    },
  };
}
