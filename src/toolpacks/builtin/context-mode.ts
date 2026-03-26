import type { ToolpackPlugin } from "../plugin.js";
import type { GeneratedFile } from "../../tool-adapters/types.js";
import { mergeCursorMcpFromDisk } from "../../mcp/cursor-mcp.js";

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
      const { path, content } = mergeCursorMcpFromDisk(cwd, "context-mode", {
        command: "npx",
        args: ["-y", "context-mode"],
      });
      files.push({
        path,
        content,
        description: "Cursor MCP config (merged context-mode)",
      });
    }
    return files;
  },
};
