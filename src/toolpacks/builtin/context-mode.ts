import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ToolpackPlugin } from "../plugin.js";
import type { GeneratedFile } from "../../tool-adapters/types.js";

export const contextModePlugin: ToolpackPlugin = {
  id: "context-mode",
  name: "Context Mode",
  description: "MCP context sandbox with session continuity and local knowledge indexing",
  category: "context-engineering",
  version: "1.0.0",
  source: "builtin",
  install: { type: "npm", package: "context-mode" },
  relevantTools: ["cursor", "claude-code", "codex", "opencode"],
  generateFiles(tools, _projectName, cwd) {
    const files: GeneratedFile[] = [];
    if (tools.includes("cursor")) {
      let mcpConfig: Record<string, unknown> = { mcpServers: {} };
      const mcpPath = join(cwd, ".cursor/mcp.json");
      if (existsSync(mcpPath)) {
        try {
          mcpConfig = JSON.parse(readFileSync(mcpPath, "utf-8"));
          if (!mcpConfig.mcpServers || typeof mcpConfig.mcpServers !== "object") {
            mcpConfig.mcpServers = {};
          }
        } catch { /* start fresh */ }
      }
      (mcpConfig.mcpServers as Record<string, unknown>)["context-mode"] = {
        command: "npx",
        args: ["-y", "context-mode"],
      };
      files.push({
        path: ".cursor/mcp.json",
        content: JSON.stringify(mcpConfig, null, 2) + "\n",
        description: "Cursor MCP config (merged context-mode)",
      });
    }
    return files;
  },
};
