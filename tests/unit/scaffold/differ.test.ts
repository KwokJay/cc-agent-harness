import { describe, it, expect, afterEach } from "vitest";
import { diffPlan } from "../../../src/scaffold/differ.js";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";

let fixture: Fixture | undefined;

afterEach(async () => {
  await fixture?.cleanup();
  fixture = undefined;
});

describe("diffPlan", () => {
  it("marks new files as added", async () => {
    fixture = await createFixture({});
    const result = diffPlan(fixture.dir, [
      { path: "foo.txt", content: "hello", description: "" },
    ]);
    expect(result.added).toEqual(["foo.txt"]);
    expect(result.modified).toEqual([]);
    expect(result.unchanged).toEqual([]);
  });

  it("marks identical files as unchanged", async () => {
    fixture = await createFixture({ "foo.txt": "hello" });
    const result = diffPlan(fixture.dir, [
      { path: "foo.txt", content: "hello", description: "" },
    ]);
    expect(result.unchanged).toEqual(["foo.txt"]);
    expect(result.modified).toEqual([]);
    expect(result.added).toEqual([]);
  });

  it("marks changed files as modified", async () => {
    fixture = await createFixture({ "foo.txt": "old content" });
    const result = diffPlan(fixture.dir, [
      { path: "foo.txt", content: "new content", description: "" },
    ]);
    expect(result.modified).toEqual(["foo.txt"]);
    expect(result.unchanged).toEqual([]);
  });

  it("detects removed files from previousFiles list", async () => {
    fixture = await createFixture({ "a.txt": "a", "b.txt": "b" });
    const result = diffPlan(
      fixture.dir,
      [{ path: "a.txt", content: "a", description: "" }],
      ["a.txt", "b.txt", "c.txt"],
    );
    expect(result.removed).toContain("b.txt");
    expect(result.removed).toContain("c.txt");
    expect(result.removed).not.toContain("a.txt");
  });

  it("returns empty removed when no previousFiles provided", async () => {
    fixture = await createFixture({});
    const result = diffPlan(fixture.dir, [
      { path: "new.txt", content: "x", description: "" },
    ]);
    expect(result.removed).toEqual([]);
  });

  it("handles mixed scenario correctly", async () => {
    fixture = await createFixture({
      "same.txt": "no change",
      "changed.txt": "v1",
    });
    const result = diffPlan(
      fixture.dir,
      [
        { path: "same.txt", content: "no change", description: "" },
        { path: "changed.txt", content: "v2", description: "" },
        { path: "brand-new.txt", content: "fresh", description: "" },
      ],
      ["same.txt", "changed.txt", "deleted.txt"],
    );
    expect(result.unchanged).toEqual(["same.txt"]);
    expect(result.modified).toEqual(["changed.txt"]);
    expect(result.added).toEqual(["brand-new.txt"]);
    expect(result.removed).toEqual(["deleted.txt"]);
  });
});
