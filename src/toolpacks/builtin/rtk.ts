import type { ToolpackPlugin } from "../plugin.js";

export const rtkPlugin: ToolpackPlugin = {
  id: "rtk",
  name: "RTK",
  description: "Terminal output compression proxy that reduces token usage by 60-90%",
  category: "context-engineering",
  version: "1.0.0",
  source: "builtin",
  provenance: "official",
  verificationHint: "Teams standardize terminal/context compression alongside `harn update` baselines.",
  expectedOutcomes: ["RTK available for token-efficient terminal workflows across comparable repos."],
  install: { type: "brew", formula: "rtk" },
  relevantTools: ["cursor", "claude-code", "copilot", "codex", "opencode"],
  generateFiles() {
    return [];
  },
};
