import type { ToolId } from "../tool-adapters/types.js";
import type { GeneratedFile } from "../tool-adapters/types.js";

export type ToolpackCategory =
  | "context-engineering"
  | "analysis"
  | "engineering-support"
  | "init-enhancement";

export interface Toolpack {
  id: string;
  name: string;
  description: string;
  category: ToolpackCategory;
  repo: string;
  required: boolean;
  installMethod: "npm" | "brew" | "git-clone" | "plugin" | "copy";
  installCommand: string;
  relevantTools: ToolId[];
  generateFiles(tools: ToolId[], projectName: string): GeneratedFile[];
}

const TOOLPACKS: Toolpack[] = [
  {
    id: "context-mode",
    name: "Context Mode",
    description: "MCP context sandbox with session continuity and local knowledge indexing",
    category: "context-engineering",
    repo: "https://github.com/mksglu/context-mode",
    required: false,
    installMethod: "npm",
    installCommand: "npm install -g context-mode",
    relevantTools: ["cursor", "claude-code", "codex", "opencode"],
    generateFiles(tools, _projectName) {
      const files: GeneratedFile[] = [];
      if (tools.includes("cursor")) {
        files.push({
          path: ".cursor/mcp.json",
          content: JSON.stringify({ mcpServers: { "context-mode": { command: "npx", args: ["-y", "context-mode"] } } }, null, 2) + "\n",
          description: "Cursor MCP config for context-mode",
        });
      }
      return files;
    },
  },
  {
    id: "rtk",
    name: "RTK",
    description: "Terminal output compression proxy that reduces token usage by 60-90%",
    category: "context-engineering",
    repo: "https://github.com/rtk-ai/rtk",
    required: false,
    installMethod: "brew",
    installCommand: "brew install rtk",
    relevantTools: ["cursor", "claude-code", "copilot", "codex", "opencode"],
    generateFiles() {
      return [];
    },
  },
  {
    id: "understand-anything",
    name: "Understand Anything",
    description: "Multi-agent codebase analysis that builds knowledge graphs and architecture dashboards",
    category: "analysis",
    repo: "https://github.com/Lum1104/Understand-Anything",
    required: false,
    installMethod: "plugin",
    installCommand: "# Claude Code: /plugin marketplace add Lum1104/Understand-Anything",
    relevantTools: ["claude-code", "codex", "cursor"],
    generateFiles() {
      return [];
    },
  },
  {
    id: "gstack",
    name: "gstack",
    description: "Skills suite that turns Claude Code into a virtual engineering team with QA, review, shipping workflows",
    category: "engineering-support",
    repo: "https://github.com/garrytan/gstack",
    required: false,
    installMethod: "git-clone",
    installCommand: "git clone https://github.com/garrytan/gstack.git .claude/skills/gstack && cd .claude/skills/gstack && ./setup",
    relevantTools: ["claude-code", "codex"],
    generateFiles(tools) {
      const files: GeneratedFile[] = [];
      if (tools.includes("claude-code")) {
        files.push({
          path: ".claude/skills/gstack/.gitkeep",
          content: "# Run: git clone https://github.com/garrytan/gstack.git .claude/skills/gstack && cd .claude/skills/gstack && ./setup\n",
          description: "gstack placeholder (requires manual clone + setup)",
        });
      }
      return files;
    },
  },
];

export function getAllToolpacks(): Toolpack[] {
  return TOOLPACKS;
}

export function getOptionalToolpacks(): Toolpack[] {
  return TOOLPACKS.filter((tp) => !tp.required);
}

export function getToolpack(id: string): Toolpack | undefined {
  return TOOLPACKS.find((tp) => tp.id === id);
}

export function getToolpacksByCategory(category: ToolpackCategory): Toolpack[] {
  return TOOLPACKS.filter((tp) => tp.category === category);
}

export function generateToolpackSetupGuide(selectedPacks: string[], tools: ToolId[]): GeneratedFile {
  const packs = selectedPacks.map((id) => getToolpack(id)).filter(Boolean) as Toolpack[];
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
