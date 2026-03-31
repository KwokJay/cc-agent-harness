import { describe, it, expect, afterEach } from "vitest";
import { resolve as resolveScaffold } from "../../src/scaffold/resolver.js";
import { ALL_TOOL_IDS } from "../../src/tool-adapters/index.js";
import { createFixture, type Fixture } from "../helpers/mock-fs.js";

/**
 * Regression guard: resolver stays fast enough for large tool / monorepo plans.
 */
describe("perf budget: resolveScaffold", () => {
  let fx: Fixture | undefined;

  afterEach(async () => {
    await fx?.cleanup();
    fx = undefined;
  });

  it("100 resolves with all tools completes within budget", async () => {
    fx = await createFixture({
      "package.json": '{"name":"root"}',
    });

    const iterations = 100;
    const t0 = performance.now();
    for (let i = 0; i < iterations; i++) {
      resolveScaffold({
        cwd: fx.dir,
        projectName: "perf",
        projectType: "monorepo",
        tools: [...ALL_TOOL_IDS],
        toolpacks: ["context-mode"],
        skipDocs: false,
      });
    }
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(8000);
  });
});
