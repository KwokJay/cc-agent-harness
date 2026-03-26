import { describe, it, expect, afterEach } from "vitest";
import { generateFiles } from "../../../src/scaffold/generator.js";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hashBody } from "../../../src/skill-extraction/parser.js";

let fixture: Fixture | undefined;

afterEach(async () => {
  await fixture?.cleanup();
  fixture = undefined;
});

const skillPath = ".harness/skills/custom-skill/SKILL.md";

describe("generateFiles harness skill merge", () => {
  it("creates new skill with enriched frontmatter including body_hash", async () => {
    fixture = await createFixture({});
    const raw = "---\nname: custom-skill\ndescription: Test\n---\n\nBody line.\n";
    const result = await generateFiles(fixture.dir, [
      {
        path: skillPath,
        content: raw,
        description: "test",
        harnessSkillSource: "static-analysis",
      },
    ]);
    expect(result.mergeApplied.length).toBe(1);
    expect(result.mergeSkipped).toEqual([]);
    const written = readFileSync(join(fixture.dir, skillPath), "utf-8");
    expect(written).toContain("body_hash:");
    expect(written).toContain("source: static-analysis");
    expect(written).toContain("version: 1");
    expect(written).toContain("harness_version:");
  });

  it("skips overwriting manual skill on disk", async () => {
    const body = "User owned content.";
    const h = hashBody(body);
    const existing = [
      "---",
      "name: custom-skill",
      "description: Mine",
      "version: 2",
      "source: manual",
      `body_hash: ${h}`,
      "---",
      "",
      body,
      "",
    ].join("\n");
    fixture = await createFixture({ [skillPath]: existing });
    const result = await generateFiles(
      fixture.dir,
      [
        {
          path: skillPath,
          content: "---\nname: custom-skill\ndescription: Generated\n---\n\nReplaced.\n",
          description: "gen",
          harnessSkillSource: "static-analysis",
        },
      ],
      { mergeStrategy: "keep-manual" },
    );
    expect(result.mergeSkipped).toEqual([skillPath]);
    expect(readFileSync(join(fixture.dir, skillPath), "utf-8")).toBe(existing);
  });

  it("detects manual edit via body_hash mismatch and skips", async () => {
    const originalBody = "original";
    const staleHash = hashBody(originalBody);
    const diskContent = [
      "---",
      "name: custom-skill",
      "description: x",
      "version: 1",
      "source: static-analysis",
      `body_hash: ${staleHash}`,
      "---",
      "",
      "edited by user",
      "",
    ].join("\n");
    fixture = await createFixture({ [skillPath]: diskContent });
    const result = await generateFiles(fixture.dir, [
      {
        path: skillPath,
        content: "---\nname: custom-skill\ndescription: x\n---\n\nnew generated body\n",
        description: "gen",
        harnessSkillSource: "static-analysis",
      },
    ]);
    expect(result.mergeSkipped).toEqual([skillPath]);
    expect(readFileSync(join(fixture.dir, skillPath), "utf-8")).toBe(diskContent);
  });

  it("overwrite strategy replaces manual skill", async () => {
    const body = "keep me";
    const h = hashBody(body);
    const existing = [
      "---",
      "name: custom-skill",
      "description: Mine",
      "version: 9",
      "source: manual",
      `body_hash: ${h}`,
      "---",
      "",
      body,
      "",
    ].join("\n");
    fixture = await createFixture({ [skillPath]: existing });
    await generateFiles(
      fixture.dir,
      [
        {
          path: skillPath,
          content: "---\nname: custom-skill\ndescription: New\n---\n\nFresh.\n",
          description: "gen",
          harnessSkillSource: "static-analysis",
        },
      ],
      { overwrite: true, mergeStrategy: "overwrite" },
    );
    const written = readFileSync(join(fixture.dir, skillPath), "utf-8");
    expect(written).toContain("Fresh.");
    expect(written).not.toContain("keep me");
  });
});
