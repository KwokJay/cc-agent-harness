import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  cursorMcpDir,
  mergeCursorMcpFromDisk,
  parseCursorMcpJson,
  stringifyCursorMcp,
  cursorMcpPath,
} from "../mcp/cursor-mcp.js";

export interface McpMergeOptions {
  cwd: string;
  /** When empty, JSON must be a one-key object `{ "serverName": { ... } }`. */
  serverName: string;
  file?: string;
  dryRun?: boolean;
  /** For tests / programmatic use; when set, skips stdin and --file. */
  jsonInline?: string;
}

function readMergePayload(cwd: string, file: string | undefined, jsonInline: string | undefined): string {
  if (jsonInline !== undefined) return jsonInline;
  if (file) {
    return readFileSync(resolve(cwd, file), "utf-8");
  }
  return readFileSync(0, { encoding: "utf-8" });
}

function resolveServerNameAndConfig(
  cliName: string,
  parsed: unknown,
): { name: string; config: unknown } | { error: string } {
  if (cliName) {
    return { name: cliName, config: parsed };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { error: "mcp merge: provide [name] argument or a one-key JSON object { \"server-name\": { ... } }" };
  }
  const rec = parsed as Record<string, unknown>;
  const keys = Object.keys(rec);
  if (keys.length !== 1) {
    return { error: "mcp merge: without [name], JSON must have exactly one top-level key (the server name)" };
  }
  const name = keys[0];
  const config = rec[name];
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    return { error: "mcp merge: server config must be a JSON object" };
  }
  return { name, config };
}

export function runMcpMerge(opts: McpMergeOptions): { ok: boolean; message: string; content?: string } {
  let raw: string;
  try {
    raw = readMergePayload(opts.cwd, opts.file, opts.jsonInline).trim();
  } catch (e) {
    return { ok: false, message: `mcp merge: could not read input: ${String(e)}` };
  }

  if (!raw) {
    return { ok: false, message: "mcp merge: empty input (use --file <path> or pipe JSON)" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, message: `mcp merge: invalid JSON: ${String(e)}` };
  }

  const resolved = resolveServerNameAndConfig(opts.serverName, parsed);
  if ("error" in resolved) {
    return { ok: false, message: resolved.error };
  }

  const { path: relPath, content } = mergeCursorMcpFromDisk(opts.cwd, resolved.name, resolved.config);
  const absPath = resolve(opts.cwd, relPath);

  if (opts.dryRun) {
    return { ok: true, message: `Dry run — would write ${relPath}`, content };
  }

  try {
    mkdirSync(cursorMcpDir(opts.cwd), { recursive: true });
    writeFileSync(absPath, content, "utf-8");
  } catch (e) {
    return { ok: false, message: `mcp merge: write failed: ${String(e)}` };
  }

  return { ok: true, message: `Merged MCP server "${resolved.name}" into ${relPath}` };
}

export function runMcpMergeCli(opts: { cwd: string; name?: string; file?: string; dryRun?: boolean }): void {
  const result = runMcpMerge({
    cwd: opts.cwd,
    serverName: opts.name ?? "",
    file: opts.file,
    dryRun: opts.dryRun,
  });
  if (result.content !== undefined && opts.dryRun) {
    process.stdout.write(result.content);
  } else {
    console.log(result.message);
  }
  if (!result.ok) process.exitCode = 1;
}

export { parseCursorMcpJson, stringifyCursorMcp, cursorMcpPath };
