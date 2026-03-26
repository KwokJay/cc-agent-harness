import { describe, it, expect } from "vitest";
import { mergeSkill } from "../../../src/skill-extraction/merger.js";
import { hashBody, type ParsedSkill } from "../../../src/skill-extraction/parser.js";

function makeSkill(overrides: Partial<ParsedSkill> = {}): ParsedSkill {
  const body = overrides.body ?? "default body";
  return {
    name: "test-skill",
    description: "A test skill",
    version: 1,
    source: "static-analysis",
    body,
    bodyHash: hashBody(body),
    ...overrides,
  };
}

describe("mergeSkill", () => {
  it("creates when no existing skill", () => {
    const generated = makeSkill({ version: 1 });
    const result = mergeSkill(null, generated);
    expect(result.action).toBe("create");
    expect(result.content).toContain("name: test-skill");
  });

  it("never overwrites manual skills", () => {
    const existing = makeSkill({ source: "manual", version: 1 });
    const generated = makeSkill({ version: 2 });
    const result = mergeSkill(existing, generated);
    expect(result.action).toBe("skip");
    expect(result.reason).toContain("Manual skill");
  });

  it("updates ai-extraction when version is newer", () => {
    const existing = makeSkill({ source: "ai-extraction", version: 1 });
    const generated = makeSkill({ source: "ai-extraction", version: 2 });
    const result = mergeSkill(existing, generated);
    expect(result.action).toBe("update");
    expect(result.reason).toContain("v1");
    expect(result.reason).toContain("v2");
  });

  it("skips ai-extraction when version is not newer", () => {
    const existing = makeSkill({ source: "ai-extraction", version: 2 });
    const generated = makeSkill({ source: "ai-extraction", version: 2 });
    const result = mergeSkill(existing, generated);
    expect(result.action).toBe("skip");
  });

  it("detects manual edits on static-analysis skills", () => {
    const existing = makeSkill({
      source: "static-analysis",
      version: 1,
      body: "modified body",
      bodyHash: hashBody("original body"),
    });
    const generated = makeSkill({ version: 2 });
    const result = mergeSkill(existing, generated);
    expect(result.action).toBe("skip");
    expect(result.reason).toContain("manual edits");
  });

  it("updates static-analysis skills when body is unmodified", () => {
    const body = "original body";
    const existing = makeSkill({
      source: "static-analysis",
      version: 1,
      body,
      bodyHash: hashBody(body),
    });
    const generated = makeSkill({ version: 2, body: "new body" });
    const result = mergeSkill(existing, generated);
    expect(result.action).toBe("update");
  });

  it("updates preset skills normally", () => {
    const body = "preset content";
    const existing = makeSkill({
      source: "preset",
      version: 1,
      body,
      bodyHash: hashBody(body),
    });
    const generated = makeSkill({ source: "preset", version: 2, body: "updated preset" });
    const result = mergeSkill(existing, generated);
    expect(result.action).toBe("update");
  });

  it("always updates with overwrite strategy", () => {
    const existing = makeSkill({ source: "manual", version: 999 });
    const generated = makeSkill({ version: 1 });
    const result = mergeSkill(existing, generated, "overwrite");
    expect(result.action).toBe("update");
    expect(result.reason).toContain("Overwrite");
  });
});
