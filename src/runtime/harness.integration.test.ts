import { cp, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runContextBuild } from "../cli/context.js";
import { runDoctor } from "../cli/doctor.js";
import { runList } from "../cli/list.js";
import { runVerify } from "../cli/verify.js";
import { HarnessRuntime } from "./harness.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);
const fixtureDir = resolve(currentDir, "../../test/fixtures/basic-project");

function captureConsole(method: "log" | "error" = "log") {
  const calls: string[] = [];
  vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
    calls.push(args.map((arg) => String(arg)).join(" "));
  });

  return {
    getOutput(): string {
      return calls.join("\n");
    },
    getLast(): string {
      return calls.at(-1) ?? "";
    },
  };
}

async function prepareFixture(): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), "agent-harness-"));
  await cp(fixtureDir, tempDir, { recursive: true });
  return tempDir;
}

describe("HarnessRuntime integration", () => {
  let originalCwd = process.cwd();

  beforeEach(() => {
    originalCwd = process.cwd();
    process.exitCode = undefined;
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.exitCode = undefined;
    vi.restoreAllMocks();
  });

  it("builds tasks, features, context, and hooks from a configured project", async () => {
    const cwd = await prepareFixture();
    const runtime = await HarnessRuntime.create({ cwd, requireProjectConfig: true });

    const tasks = runtime.listTasks();
    expect(tasks.map((task) => task.name)).toEqual(
      expect.arrayContaining(["build", "test", "lint", "coverage"]),
    );

    const features = runtime.listFeatureStates();
    expect(features).toHaveLength(1);
    expect(features[0].spec.key).toBe("preview_context");
    expect(features[0].enabled).toBe(true);

    const context = await runtime.buildContext({ tagStyle: "none" });
    expect(context.rendered).toContain("Basic Fixture");
    expect(context.rendered).toContain("Always explain trade-offs");
    expect(context.rendered).toContain("example-skill");

    const hookResults = await runtime.dispatchHooks("verify.post", { match: "coverage" });
    expect(hookResults).toHaveLength(1);
    expect(hookResults[0].stdout).toContain("verify-hook");
  });

  it("lists unified commands with source metadata", async () => {
    const cwd = await prepareFixture();
    process.chdir(cwd);
    const captured = captureConsole();

    await runList("commands");

    expect(captured.getOutput()).toContain("build: npm run build [adapter via typescript]");
    expect(captured.getOutput()).toContain('coverage: node -e "process.exit(0)" [workflow]');
  });

  it("lists feature states from config", async () => {
    const cwd = await prepareFixture();
    process.chdir(cwd);
    const captured = captureConsole();

    await runList("features");

    expect(captured.getOutput()).toContain("preview_context: enabled (experimental) configured=true");
  });

  it("prints verification results as JSON", async () => {
    const cwd = await prepareFixture();
    process.chdir(cwd);
    const captured = captureConsole();

    await runVerify({ json: true });

    const payload = JSON.parse(captured.getLast()) as {
      summary: { pass: number; fail: number; skip: number };
      results: Array<{ stage: string; source?: string; status: string }>;
    };

    expect(payload.summary).toEqual({ pass: 4, fail: 0, skip: 0, totalMs: expect.any(Number) });
    expect(payload.results).toHaveLength(4);
    expect(payload.results.find((result) => result.stage === "coverage")?.source).toBe("workflow");
  });

  it("prints doctor results as JSON with features", async () => {
    const cwd = await prepareFixture();
    process.chdir(cwd);
    const captured = captureConsole();

    await runDoctor({ json: true });

    const payload = JSON.parse(captured.getLast()) as {
      adapter: string | null;
      features: Array<{ key: string; enabled: boolean }>;
      summary: { pass: number; warn: number; fail: number };
    };

    expect(payload.adapter).toBe("typescript");
    expect(payload.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "preview_context", enabled: true }),
      ]),
    );
    expect(payload.summary.fail).toBe(0);
  });

  it("writes assembled context to a file", async () => {
    const cwd = await prepareFixture();
    process.chdir(cwd);

    await runContextBuild({
      format: "none",
      output: "generated/context.txt",
    });

    const contextFile = await readFile(join(cwd, "generated/context.txt"), "utf-8");
    expect(contextFile).toContain("Basic Fixture");
    expect(contextFile).toContain("Example fixture skill");
  });
});
