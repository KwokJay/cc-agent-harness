import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const harnessJs = join(pkgRoot, "dist/harness.js");

function runHarness(cwd: string, args: string[]): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync(process.execPath, [harnessJs, ...args], {
      cwd,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    const e = err as { status: number; stdout?: string; stderr?: string };
    return {
      status: e.status ?? 1,
      stdout: typeof e.stdout === "string" ? e.stdout : "",
      stderr: typeof e.stderr === "string" ? e.stderr : "",
    };
  }
}

describe("CLI smoke (dist/harness.js)", () => {
  it("init, doctor, update --dry-run, verify", () => {
    expect(existsSync(harnessJs), `missing ${harnessJs}; run pnpm build`).toBe(true);

    const dir = mkdtempSync(join(tmpdir(), "harness-e2e-"));

    let r = runHarness(dir, ["init", "-p", "backend", "-t", "cursor", "-n", "e2e-app"]);
    expect(r.status, r.stderr + r.stdout).toBe(0);
    expect(existsSync(join(dir, ".harness", "config.yaml"))).toBe(true);

    r = runHarness(dir, ["doctor"]);
    expect(r.status, r.stderr + r.stdout).toBe(0);

    r = runHarness(dir, ["update", "--dry-run"]);
    expect(r.status, r.stderr + r.stdout).toBe(0);

    r = runHarness(dir, ["verify"]);
    expect(r.status, r.stderr + r.stdout).toBe(0);

    r = runHarness(dir, ["manifest"]);
    expect(r.status, r.stderr + r.stdout).toBe(0);
    expect(existsSync(join(dir, ".harness", "manifest.json"))).toBe(true);

    r = runHarness(dir, ["export", "-f", "json", "-o", join(dir, "export.json")]);
    expect(r.status, r.stderr + r.stdout).toBe(0);
    expect(existsSync(join(dir, "export.json"))).toBe(true);

    r = runHarness(dir, ["diagnose", "--json"]);
    expect(r.status, r.stderr + r.stdout).toBe(0);

    r = runHarness(dir, ["migrate", "0.5.0"]);
    expect(r.status, r.stderr + r.stdout).toBe(0);
  });
});
