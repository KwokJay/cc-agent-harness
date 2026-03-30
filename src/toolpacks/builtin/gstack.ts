import type { ToolpackPlugin } from "../plugin.js";
import type { GeneratedFile } from "../../tool-adapters/types.js";

export const gstackPlugin: ToolpackPlugin = {
  id: "gstack",
  name: "gstack",
  description: "Skills suite that turns Claude Code into a virtual engineering team with QA, review, shipping workflows",
  category: "engineering-support",
  version: "1.0.0",
  source: "builtin",
  provenance: "official",
  verificationHint: "Use with `harn verify` / `harn diagnose --json` so merge gates stay auditable.",
  expectedOutcomes: ["gstack skills scaffolded under `.claude/skills/gstack` for QA/review/ship workflows."],
  install: {
    type: "git-clone",
    repo: "https://github.com/garrytan/gstack.git",
    command:
      "git clone https://github.com/garrytan/gstack.git .claude/skills/gstack && cd .claude/skills/gstack && ./setup",
  },
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
};
