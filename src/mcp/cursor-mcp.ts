/**
 * Cursor-only MCP file helpers: read/merge **`.cursor/mcp.json`** (`mcpServers`).
 * This is not a generic multi-tool MCP layer — other AI tools use their own config
 * (see `docs/CAPABILITY-MATRIX.md`, `mcp` column). Do not route non-Cursor MCP
 * operations through this module without extending the product contract.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface CursorMcpFile {
  mcpServers: Record<string, unknown>;
}

export function parseCursorMcpJson(content: string): CursorMcpFile {
  const raw = JSON.parse(content) as Record<string, unknown>;
  let mcpServers = raw.mcpServers;
  if (!mcpServers || typeof mcpServers !== "object" || Array.isArray(mcpServers)) {
    mcpServers = {};
  }
  return { mcpServers: mcpServers as Record<string, unknown> };
}

export function readCursorMcpFile(cwd: string): CursorMcpFile {
  const mcpPath = resolve(cwd, ".cursor/mcp.json");
  if (!existsSync(mcpPath)) {
    return { mcpServers: {} };
  }
  try {
    return parseCursorMcpJson(readFileSync(mcpPath, "utf-8"));
  } catch {
    return { mcpServers: {} };
  }
}

export function mergeCursorMcpServer(
  current: CursorMcpFile,
  serverName: string,
  serverConfig: unknown,
): CursorMcpFile {
  return {
    mcpServers: {
      ...current.mcpServers,
      [serverName]: serverConfig,
    },
  };
}

export function stringifyCursorMcp(config: CursorMcpFile): string {
  const doc = { mcpServers: config.mcpServers };
  return JSON.stringify(doc, null, 2) + "\n";
}

export function cursorMcpPath(cwd: string): string {
  return resolve(cwd, ".cursor/mcp.json");
}

/** Ensure `.cursor` exists; caller should write `stringifyCursorMcp` result. */
export function cursorMcpDir(cwd: string): string {
  return resolve(cwd, ".cursor");
}

export function mergeCursorMcpFromDisk(
  cwd: string,
  serverName: string,
  serverConfig: unknown,
): { path: string; content: string } {
  const current = readCursorMcpFile(cwd);
  const merged = mergeCursorMcpServer(current, serverName, serverConfig);
  return {
    path: ".cursor/mcp.json",
    content: stringifyCursorMcp(merged),
  };
}
