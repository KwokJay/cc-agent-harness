import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DiagnoseCheck, DiagnoseIssue } from "../types.js";

/** Cursor-only: validates `.cursor/mcp.json` when `cursor` is among configured harness tools. */
export const cursorMcpJsonCheck: DiagnoseCheck = {
  id: "mcp-json",
  description: "If .cursor/mcp.json exists, it must be valid JSON (Cursor MCP only)",
  async run(ctx): Promise<DiagnoseIssue[]> {
    if (ctx.tools !== undefined && !ctx.tools.includes("cursor")) {
      return [
        {
          id: "mcp-json.skip-capability",
          severity: "info",
          message:
            "MCP JSON check skipped — `cursor` is not in configured harness tools (MCP merge is Cursor-only; see docs/CAPABILITY-MATRIX.md)",
        },
      ];
    }

    const p = resolve(ctx.cwd, ".cursor/mcp.json");
    if (!existsSync(p)) {
      return [{ id: "mcp-json.skip", severity: "info", message: ".cursor/mcp.json not present (skipped)" }];
    }
    try {
      JSON.parse(readFileSync(p, "utf-8"));
      return [{ id: "mcp-json.ok", severity: "info", message: ".cursor/mcp.json is valid JSON" }];
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return [
        {
          id: "mcp-json.invalid",
          severity: "error",
          message: ".cursor/mcp.json is not valid JSON",
          details: msg,
        },
      ];
    }
  },
};
