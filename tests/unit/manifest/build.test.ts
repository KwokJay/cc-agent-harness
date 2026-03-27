import { describe, it, expect, afterEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { buildManifest } from "../../../src/manifest/build.js";
import { writeManifestFile, getHarnessManifestPath } from "../../../src/manifest/write.js";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";

function minimalConfigYaml(): string {
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

describe("buildManifest", () => {
  let fx: Fixture | undefined;

  afterEach(async () => {
    await fx?.cleanup();
    fx = undefined;
  });

  it("fails when config is missing", async () => {
    fx = await createFixture({});
    const r = buildManifest(fx.dir);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.length).toBeGreaterThan(0);
  });

  it("builds manifest from valid config and skills on disk", async () => {
    fx = await createFixture({
      ".harness/config.yaml": minimalConfigYaml(),
      ".harness/skills/my-skill/SKILL.md": "---\nname: my-skill\n---\nBody\n",
    });
    const r = buildManifest(fx.dir);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.manifest.manifestVersion).toBe(1);
    expect(r.manifest.project.name).toBe("demo");
    expect(r.manifest.tools).toEqual(["cursor"]);
    expect(r.manifest.skills.count).toBe(1);
    expect(r.manifest.skills.ids).toContain("my-skill");
    expect(r.manifest.verification.checks).toEqual([{ name: "lint", command: "pnpm lint" }]);
  });

  it("writeManifestFile creates JSON file", async () => {
    fx = await createFixture({
      ".harness/config.yaml": minimalConfigYaml(),
    });
    const r = buildManifest(fx.dir);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    writeManifestFile(fx.dir, r.manifest);
    const path = getHarnessManifestPath(fx.dir);
    expect(existsSync(path)).toBe(true);
    const parsed = JSON.parse(readFileSync(path, "utf-8")) as { manifestVersion: number };
    expect(parsed.manifestVersion).toBe(1);
  });
});
