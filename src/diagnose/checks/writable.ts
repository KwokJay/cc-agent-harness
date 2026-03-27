import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DiagnoseCheck, DiagnoseIssue } from "../types.js";

function tryWritableDir(cwd: string, rel: string): DiagnoseIssue | null {
  const dir = resolve(cwd, rel);
  try {
    mkdirSync(dir, { recursive: true });
    const probe = resolve(dir, `.harness-write-probe-${Date.now()}`);
    writeFileSync(probe, "ok", "utf-8");
    unlinkSync(probe);
    return null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      id: `writable.${rel.replace(/\//g, "-")}`,
      severity: "error",
      message: `Directory not writable: ${rel}`,
      details: msg,
    };
  }
}

export const harnessWritableCheck: DiagnoseCheck = {
  id: "writable",
  description: ".harness and .harness/state are writable",
  async run(ctx): Promise<DiagnoseIssue[]> {
    const issues: DiagnoseIssue[] = [];
    const h = tryWritableDir(ctx.cwd, ".harness");
    if (h) issues.push(h);
    const s = tryWritableDir(ctx.cwd, ".harness/state");
    if (s) issues.push(s);
    if (issues.length === 0) {
      issues.push({ id: "writable.ok", severity: "info", message: ".harness directories are writable" });
    }
    return issues;
  },
};
