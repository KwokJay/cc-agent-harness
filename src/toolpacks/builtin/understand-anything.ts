import type { ToolpackPlugin } from "../plugin.js";

export const understandAnythingPlugin: ToolpackPlugin = {
  id: "understand-anything",
  name: "Understand Anything",
  description: "Multi-agent codebase analysis that builds knowledge graphs and architecture dashboards",
  category: "analysis",
  version: "1.0.0",
  source: "builtin",
  install: { type: "plugin", instructions: "Claude Code: /plugin marketplace add Lum1104/Understand-Anything" },
  relevantTools: ["claude-code", "codex", "cursor"],
  generateFiles() {
    return [];
  },
};
