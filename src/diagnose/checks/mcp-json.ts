import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DiagnoseCheck, DiagnoseIssue } from "../types.js";

export const cursorMcpJsonCheck: DiagnoseCheck = {
  id: "mcp-json",
  description: "If .cursor/mcp.json exists, it must be valid JSON",
  async run(ctx): Promise<DiagnoseIssue[]> {
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
