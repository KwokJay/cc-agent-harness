import { describe, it, expect, afterEach } from "vitest";
import { discoverHarnessSkillIds, getDistributedSkillPath, isMetaSkill } from "../../../src/harness-inventory/index.js";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";

describe("harness-inventory", () => {
  let fx: Fixture | undefined;

  afterEach(async () => {
    await fx?.cleanup();
    fx = undefined;
  });

  it("discovers skill ids with SKILL.md", async () => {
    fx = await createFixture({
      ".harness/skills/a/SKILL.md": "x",
      ".harness/skills/b/SKILL.md": "y",
    });
    const ids = discoverHarnessSkillIds(fx.dir).sort();
    expect(ids).toEqual(["a", "b"]);
  });

  it("getDistributedSkillPath returns path for known tools", () => {
    expect(getDistributedSkillPath("cursor", "foo")).toBe(".cursor/rules/skill-foo.mdc");
    expect(getDistributedSkillPath("unknown", "foo")).toBe("");
  });

  it("isMetaSkill flags governance skills", () => {
    expect(isMetaSkill("skill-creator")).toBe(true);
    expect(isMetaSkill("my-skill")).toBe(false);
  });
});
