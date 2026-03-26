import { describe, it, expect } from "vitest";
import { parseSkillFile, serializeSkill, hashBody } from "../../../src/skill-extraction/parser.js";

describe("parseSkillFile", () => {
  it("parses complete frontmatter", () => {
    const content = [
      "---",
      "name: typescript-conventions",
      "description: TS rules",
      "version: 2",
      "source: static-analysis",
      "generated_at: 2026-03-26",
      "harness_version: 0.2.3",
      "---",
      "",
      "Use strict mode.",
    ].join("\n");

    const result = parseSkillFile(content);
    expect(result.name).toBe("typescript-conventions");
    expect(result.description).toBe("TS rules");
    expect(result.version).toBe(2);
    expect(result.source).toBe("static-analysis");
    expect(result.generatedAt).toBe("2026-03-26");
    expect(result.harnessVersion).toBe("0.2.3");
    expect(result.body).toBe("Use strict mode.");
    expect(result.bodyHash).toBe(hashBody("Use strict mode."));
  });

  it("defaults version to 0 when missing", () => {
    const content = "---\nname: test\ndescription: desc\n---\nbody";
    const result = parseSkillFile(content);
    expect(result.version).toBe(0);
  });

  it("defaults source to manual for unknown values", () => {
    const content = "---\nname: test\ndescription: desc\nsource: alien\n---\nbody";
    const result = parseSkillFile(content);
    expect(result.source).toBe("manual");
  });

  it("handles content without frontmatter", () => {
    const result = parseSkillFile("Just plain body text");
    expect(result.name).toBe("unknown");
    expect(result.body).toBe("Just plain body text");
    expect(result.version).toBe(0);
  });

  it("handles empty body", () => {
    const content = "---\nname: empty-skill\ndescription: nothing\nversion: 1\nsource: preset\n---\n";
    const result = parseSkillFile(content);
    expect(result.name).toBe("empty-skill");
    expect(result.body).toBe("");
  });
});

describe("serializeSkill", () => {
  it("round-trips through parse and serialize", () => {
    const original = [
      "---",
      "name: my-skill",
      "description: A test skill",
      "version: 3",
      "source: preset",
      "generated_at: 2026-01-01",
      "harness_version: 0.2.3",
      "---",
      "",
      "Skill body content here.",
      "",
    ].join("\n");

    const parsed = parseSkillFile(original);
    const serialized = serializeSkill(parsed);
    const reparsed = parseSkillFile(serialized);

    expect(reparsed.name).toBe(parsed.name);
    expect(reparsed.description).toBe(parsed.description);
    expect(reparsed.version).toBe(parsed.version);
    expect(reparsed.source).toBe(parsed.source);
    expect(reparsed.body).toBe(parsed.body);
  });

  it("omits optional fields when not present but always writes body_hash", () => {
    const serialized = serializeSkill({
      name: "test",
      description: "desc",
      version: 1,
      source: "preset",
      body: "content",
      bodyHash: hashBody("content"),
    });
    expect(serialized).not.toContain("generated_at");
    expect(serialized).not.toContain("harness_version");
    expect(serialized).toContain("body_hash:");
    expect(serialized).toContain(hashBody("content"));
  });

  it("reads body_hash from frontmatter for stale-hash detection", () => {
    const oldHash = hashBody("original body");
    const content = [
      "---",
      "name: x",
      "description: d",
      "version: 1",
      "source: static-analysis",
      `body_hash: ${oldHash}`,
      "---",
      "",
      "user edited body",
    ].join("\n");
    const result = parseSkillFile(content);
    expect(result.bodyHash).toBe(oldHash);
    expect(result.body).toBe("user edited body");
    expect(hashBody(result.body)).not.toBe(oldHash);
  });
});

describe("hashBody", () => {
  it("returns consistent hash for same content", () => {
    expect(hashBody("hello")).toBe(hashBody("hello"));
  });

  it("ignores leading/trailing whitespace", () => {
    expect(hashBody("  hello  ")).toBe(hashBody("hello"));
  });

  it("differs for different content", () => {
    expect(hashBody("a")).not.toBe(hashBody("b"));
  });
});
