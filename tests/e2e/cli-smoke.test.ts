import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
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

    // Golden path 1 (docs/GOLDEN-PATHS.md): backend + Cursor + Claude Code; skip AI extraction for CI determinism
    let r = runHarness(dir, [
      "init",
      "-p",
      "backend",
      "-t",
      "cursor,claude-code",
      "-n",
      "e2e-app",
      "--skip-skill-extraction",
    ]);
    expect(r.status, r.stderr + r.stdout).toBe(0);
    expect(existsSync(join(dir, ".harness", "config.yaml"))).toBe(true);
    expect(existsSync(join(dir, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(dir, "CLAUDE.md"))).toBe(true);
    expect(existsSync(join(dir, ".cursor", "rules", "project.mdc"))).toBe(true);
    expect(existsSync(join(dir, ".claude", "skills", "api-conventions", "SKILL.md"))).toBe(true);

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
    const exported = JSON.parse(readFileSync(join(dir, "export.json"), "utf-8")) as {
      adoption: { toolsEnabled: number; verificationChecksConfigured: number };
      health: { artifactCoverageRatio: number; daysSinceLastVerify: number | null };
    };
    expect(exported.adoption.toolsEnabled).toBeGreaterThanOrEqual(2);
    expect(exported.adoption.verificationChecksConfigured).toBeGreaterThanOrEqual(1);
    expect(exported.health.artifactCoverageRatio).toBeLessThanOrEqual(1);
    expect(exported.health.artifactCoverageRatio).toBeGreaterThanOrEqual(0);

    r = runHarness(dir, ["diagnose", "--json"]);
    expect(r.status, r.stderr + r.stdout).toBe(0);

    r = runHarness(dir, ["migrate", "0.5.0"]);
    expect(r.status, r.stderr + r.stdout).toBe(0);
  });

  it("golden path: frontend + cursor,codex (artifact set)", () => {
    expect(existsSync(harnessJs), `missing ${harnessJs}; run pnpm build`).toBe(true);
    const dir = mkdtempSync(join(tmpdir(), "harness-e2e-gp-fe-"));
    const r = runHarness(dir, [
      "init",
      "-p",
      "frontend",
      "-t",
      "cursor,codex",
      "-n",
      "gp-fe",
      "--skip-skill-extraction",
    ]);
    expect(r.status, r.stderr + r.stdout).toBe(0);
    expect(existsSync(join(dir, ".harness", "config.yaml"))).toBe(true);
    expect(existsSync(join(dir, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(dir, ".codex", "config.toml"))).toBe(true);
    expect(existsSync(join(dir, ".agents", "skills", "frontend-conventions", "SKILL.md"))).toBe(true);
    expect(existsSync(join(dir, ".cursor", "rules", "skill-frontend-conventions.mdc"))).toBe(true);
  });

  it("golden path: monorepo + cursor,claude-code,codex (artifact set)", () => {
    expect(existsSync(harnessJs), `missing ${harnessJs}; run pnpm build`).toBe(true);
    const dir = mkdtempSync(join(tmpdir(), "harness-e2e-gp-mono-"));
    const r = runHarness(dir, [
      "init",
      "-p",
      "monorepo",
      "-t",
      "cursor,claude-code,codex",
      "-n",
      "gp-mono",
      "--skip-skill-extraction",
    ]);
    expect(r.status, r.stderr + r.stdout).toBe(0);
    expect(existsSync(join(dir, ".harness", "config.yaml"))).toBe(true);
    expect(existsSync(join(dir, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(dir, "CLAUDE.md"))).toBe(true);
    expect(existsSync(join(dir, ".codex", "config.toml"))).toBe(true);
    expect(existsSync(join(dir, ".claude", "skills", "monorepo-discipline", "SKILL.md"))).toBe(true);
    expect(existsSync(join(dir, ".agents", "skills", "monorepo-discipline", "SKILL.md"))).toBe(true);
    expect(existsSync(join(dir, ".cursor", "rules", "skill-monorepo-discipline.mdc"))).toBe(true);
  });
});
