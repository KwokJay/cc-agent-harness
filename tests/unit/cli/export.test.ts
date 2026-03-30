import { describe, it, expect, afterEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { runExport } from "../../../src/cli/export.js";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";

function configYaml(): string {
  return `
project:
  name: demo
  type: backend
  language: typescript
tools:
  - cursor
workflows:
  commands:
    lint: pnpm lint
  verification:
    checks:
      - lint
custom_rules: []
`;
}

describe("runExport", () => {
  let fx: Fixture | undefined;

  afterEach(async () => {
    await fx?.cleanup();
    fx = undefined;
  });

  it("writes markdown to file", async () => {
    fx = await createFixture({ ".harness/config.yaml": configYaml() });
    const out = join(fx.dir, "out.md");
    await runExport({ format: "md", out, cwd: fx.dir });
    expect(existsSync(out)).toBe(true);
    const text = readFileSync(out, "utf-8");
    expect(text).toContain("# Harness export");
    expect(text).toContain("demo");
    expect(text).toContain("lint");
    expect(text).toContain("## Adoption");
    expect(text).toContain("## Health");
  });

  it("writes json to file", async () => {
    fx = await createFixture({ ".harness/config.yaml": configYaml() });
    const out = join(fx.dir, "out.json");
    await runExport({ format: "json", out, cwd: fx.dir });
    const parsed = JSON.parse(readFileSync(out, "utf-8")) as {
      project: { name: string };
      adoption: { toolsEnabled: number };
      health: { artifactCoverageRatio: number };
    };
    expect(parsed.project.name).toBe("demo");
    expect(parsed.adoption.toolsEnabled).toBe(1);
    expect(parsed.health.artifactCoverageRatio).toBe(1);
  });
});
