import { describe, it, expect } from "vitest";
import { readFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runMcpMerge } from "../../../src/cli/mcp.js";

describe("runMcpMerge", () => {
  it("merges server when name and JSON body provided", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-cli-"));
    const r = runMcpMerge({
      cwd: dir,
      serverName: "myapp",
      jsonInline: JSON.stringify({ command: "node", args: ["server.js"] }),
    });
    expect(r.ok).toBe(true);
    const content = readFileSync(join(dir, ".cursor/mcp.json"), "utf-8");
    const j = JSON.parse(content) as { mcpServers: Record<string, unknown> };
    expect(j.mcpServers.myapp).toEqual({ command: "node", args: ["server.js"] });
  });

  it("infers server name from single-key JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-cli-"));
    const r = runMcpMerge({
      cwd: dir,
      serverName: "",
      jsonInline: JSON.stringify({ inferred: { command: "npx", args: ["-y", "pkg"] } }),
    });
    expect(r.ok).toBe(true);
    const content = readFileSync(join(dir, ".cursor/mcp.json"), "utf-8");
    const j = JSON.parse(content) as { mcpServers: Record<string, unknown> };
    expect(j.mcpServers.inferred).toEqual({ command: "npx", args: ["-y", "pkg"] });
  });

  it("dry-run does not write file", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-cli-"));
    runMcpMerge({
      cwd: dir,
      serverName: "x",
      jsonInline: "{}",
      dryRun: true,
    });
    expect(() => readFileSync(join(dir, ".cursor/mcp.json"))).toThrow();
  });
});
