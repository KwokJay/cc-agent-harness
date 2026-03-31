import type { ToolId } from "../tool-adapters/types.js";
import type { GeneratedFile } from "../tool-adapters/types.js";
import { discoverToolpacks } from "./discovery.js";
import type { ToolpackPlugin } from "./plugin.js";
import type { ToolpackInstallMethod } from "./plugin.js";
import type { ToolpackProvenance } from "./plugin.js";
import type { ToolpackCategory } from "./categories.js";
import { resolveToolpackProvenance } from "./official.js";

export type { ToolpackCategory } from "./categories.js";

export interface Toolpack {
  id: string;
  name: string;
  description: string;
  category: ToolpackCategory;
  /** Repository URL for setup guide (best-effort for npm/plugin packs). */
  repo: string;
  required: boolean;
  installMethod: "npm" | "brew" | "git-clone" | "plugin" | "copy";
  installCommand: string;
  relevantTools: ToolId[];
  /** Where the pack definition came from (discovery). */
  packSource: "builtin" | "local" | "npm";
  packVersion: string;
  /** Phase 4: official builtins vs community (npm/local). */
  provenance: ToolpackProvenance;
  /** Copied from plugin when present (manifest / docs). */
  verificationHint?: string;
  /** True when the pack declares org-wide shared policy (Phase 6). */
  sharedPolicy: boolean;
  generateFiles(tools: ToolId[], projectName: string, cwd: string): GeneratedFile[];
}

const DOC_REPOS: Partial<Record<string, string>> = {
  "context-mode": "https://github.com/mksglu/context-mode",
  rtk: "https://github.com/rtk-ai/rtk",
  "understand-anything": "https://github.com/Lum1104/Understand-Anything",
  gstack: "https://github.com/garrytan/gstack",
};

function installToToolpackFields(
  install: ToolpackInstallMethod,
): { repo: string; installMethod: Toolpack["installMethod"]; installCommand: string } {
  switch (install.type) {
    case "npm":
      return {
        repo: "",
        installMethod: "npm",
        installCommand: `npm install -g ${install.package}`,
      };
    case "brew":
      return {
        repo: "",
        installMethod: "brew",
        installCommand: `brew install ${install.formula}`,
      };
    case "git-clone":
      return {
        repo: install.repo,
        installMethod: "git-clone",
        installCommand: install.command ?? `git clone ${install.repo}`,
      };
    case "plugin": {
      const line = install.instructions.trim();
      return {
        repo: "",
        installMethod: "plugin",
        installCommand: line.startsWith("#") ? line : `# ${line}`,
      };
    }
    default: {
      const _exhaustive: never = install;
      return _exhaustive;
    }
  }
}

function pluginToToolpack(plugin: ToolpackPlugin): Toolpack {
  const { repo: installRepo, installMethod, installCommand } = installToToolpackFields(plugin.install);
  const repo = DOC_REPOS[plugin.id] ?? installRepo;
  return {
    id: plugin.id,
    name: plugin.name,
    description: plugin.description,
    category: plugin.category,
    repo,
    required: false,
    installMethod,
    installCommand,
    relevantTools: plugin.relevantTools,
    packSource: plugin.source === "npm" ? "npm" : plugin.source,
    packVersion: plugin.version,
    provenance: resolveToolpackProvenance(plugin),
    ...(plugin.verificationHint !== undefined ? { verificationHint: plugin.verificationHint } : {}),
    sharedPolicy: plugin.sharedPolicy === true,
    generateFiles: plugin.generateFiles.bind(plugin),
  };
}

const toolpackCache = new Map<string, Toolpack[]>();

function loadToolpacks(cwd: string): Toolpack[] {
  const cached = toolpackCache.get(cwd);
  if (cached) return cached;
  const result = discoverToolpacks(cwd).map(pluginToToolpack);
  toolpackCache.set(cwd, result);
  return result;
}

export function clearToolpackCache(): void {
  toolpackCache.clear();
}

export function getAllToolpacks(cwd: string = process.cwd()): Toolpack[] {
  return loadToolpacks(cwd);
}

export function getOptionalToolpacks(cwd: string = process.cwd()): Toolpack[] {
  return loadToolpacks(cwd).filter((tp) => !tp.required);
}

export function getToolpack(id: string, cwd: string = process.cwd()): Toolpack | undefined {
  return loadToolpacks(cwd).find((tp) => tp.id === id);
}

export function getToolpacksByCategory(category: ToolpackCategory, cwd: string = process.cwd()): Toolpack[] {
  return loadToolpacks(cwd).filter((tp) => tp.category === category);
}

export function generateToolpackSetupGuide(
  selectedPacks: string[],
  tools: ToolId[],
  cwd: string = process.cwd(),
): GeneratedFile {
  const packs = selectedPacks.map((id) => getToolpack(id, cwd)).filter(Boolean) as Toolpack[];
  if (packs.length === 0) {
    return {
      path: ".harness/toolpacks.md",
      content: "# Toolpacks\n\nNo optional toolpacks selected.\n",
      description: "Toolpack setup guide (empty)",
    };
  }

  const lines = [
    "# Toolpack Setup Guide",
    "",
    "The following optional toolpacks were selected during initialization.",
    "Follow the instructions below to complete their setup.",
    "",
  ];

  const byCategory = new Map<ToolpackCategory, Toolpack[]>();
  for (const pack of packs) {
    const list = byCategory.get(pack.category) ?? [];
    list.push(pack);
    byCategory.set(pack.category, list);
  }

  const categoryLabels: Record<ToolpackCategory, string> = {
    "context-engineering": "Context Engineering",
    analysis: "Analysis",
    "engineering-support": "Engineering Support",
    "init-enhancement": "Initialization Enhancement",
  };

  for (const [category, categoryPacks] of byCategory) {
    lines.push(`## ${categoryLabels[category]}`);
    lines.push("");
    for (const pack of categoryPacks) {
      lines.push(`### ${pack.name}`);
      lines.push("");
      lines.push(pack.description);
      lines.push("");
      lines.push("**Install:**");
      lines.push("");
      lines.push("```shell");
      lines.push(pack.installCommand);
      lines.push("```");
      lines.push("");
      const relevant = pack.relevantTools.filter((t) => tools.includes(t));
      if (relevant.length > 0) {
        lines.push(`**Relevant for:** ${relevant.join(", ")}`);
        lines.push("");
      }
      lines.push(`**Repository:** ${pack.repo}`);
      lines.push("");
    }
  }

  return {
    path: ".harness/toolpacks.md",
    content: lines.join("\n"),
    description: "Toolpack setup guide",
  };
}
