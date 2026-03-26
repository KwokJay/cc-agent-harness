import { describe, it, expect } from "vitest";
import { writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  mergeCursorMcpFromDisk,
  parseCursorMcpJson,
  readCursorMcpFile,
  stringifyCursorMcp,
} from "../../../src/mcp/cursor-mcp.js";

describe("cursor-mcp", () => {
  it("parseCursorMcpJson normalizes missing mcpServers", () => {
    const r = parseCursorMcpJson("{}");
    expect(r.mcpServers).toEqual({});
  });

  it("mergeCursorMcpFromDisk merges into empty project", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-"));
    const { content } = mergeCursorMcpFromDisk(dir, "s1", { command: "npx", args: ["-y", "x"] });
    const parsed = JSON.parse(content) as { mcpServers: Record<string, unknown> };
    expect(parsed.mcpServers.s1).toEqual({ command: "npx", args: ["-y", "x"] });
  });

  it("mergeCursorMcpFromDisk preserves existing servers", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-"));
    const cursorDir = join(dir, ".cursor");
    mkdirSync(cursorDir, { recursive: true });
    writeFileSync(
      join(cursorDir, "mcp.json"),
      stringifyCursorMcp({
        mcpServers: { a: { command: "old" } },
      }),
      "utf-8",
    );
    const { content } = mergeCursorMcpFromDisk(dir, "b", { command: "new" });
    const parsed = JSON.parse(content) as { mcpServers: Record<string, unknown> };
    expect(parsed.mcpServers.a).toEqual({ command: "old" });
    expect(parsed.mcpServers.b).toEqual({ command: "new" });
  });

  it("readCursorMcpFile returns empty when missing or invalid", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-"));
    expect(readCursorMcpFile(dir).mcpServers).toEqual({});
    mkdirSync(join(dir, ".cursor"), { recursive: true });
    writeFileSync(join(dir, ".cursor/mcp.json"), "not json{{{", "utf-8");
    expect(readCursorMcpFile(dir).mcpServers).toEqual({});
  });
});
