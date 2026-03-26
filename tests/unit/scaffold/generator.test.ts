import { describe, it, expect, afterEach } from "vitest";
import { generateFiles } from "../../../src/scaffold/generator.js";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

let fixture: Fixture | undefined;

afterEach(async () => {
  await fixture?.cleanup();
  fixture = undefined;
});

describe("generateFiles", () => {
  it("creates files in an empty directory", async () => {
    fixture = await createFixture({});
    const files = [
      {
        path: "a.txt",
        content: "alpha",
        description: "file a",
      },
      {
        path: "b.txt",
        content: "beta",
        description: "file b",
      },
    ];
    const result = await generateFiles(fixture.dir, files);
    expect(result.created).toEqual(["a.txt", "b.txt"]);
    expect(result.skipped).toEqual([]);
    expect(readFileSync(join(fixture.dir, "a.txt"), "utf-8")).toBe("alpha");
    expect(readFileSync(join(fixture.dir, "b.txt"), "utf-8")).toBe("beta");
  });

  it("creates nested parent directories", async () => {
    fixture = await createFixture({});
    const files = [
      {
        path: "deep/nested/dir/file.txt",
        content: "nested",
        description: "nested file",
      },
    ];
    const result = await generateFiles(fixture.dir, files);
    expect(result.created).toEqual(["deep/nested/dir/file.txt"]);
    expect(result.skipped).toEqual([]);
    expect(
      readFileSync(join(fixture.dir, "deep/nested/dir/file.txt"), "utf-8"),
    ).toBe("nested");
  });

  it("skips existing files when overwrite is false", async () => {
    fixture = await createFixture({ "keep.txt": "original" });
    const files = [
      {
        path: "keep.txt",
        content: "should-not-write",
        description: "existing",
      },
    ];
    const result = await generateFiles(fixture.dir, files, {
      overwrite: false,
    });
    expect(result.created).toEqual([]);
    expect(result.skipped).toEqual(["keep.txt"]);
    expect(readFileSync(join(fixture.dir, "keep.txt"), "utf-8")).toBe(
      "original",
    );
  });

  it("skips existing files when overwrite is undefined", async () => {
    fixture = await createFixture({ "only.txt": "old" });
    const files = [
      {
        path: "only.txt",
        content: "new",
        description: "default options",
      },
    ];
    const result = await generateFiles(fixture.dir, files);
    expect(result.created).toEqual([]);
    expect(result.skipped).toEqual(["only.txt"]);
    expect(readFileSync(join(fixture.dir, "only.txt"), "utf-8")).toBe("old");
  });

  it("overwrites existing files when overwrite is true", async () => {
    fixture = await createFixture({ "overwrite.txt": "before" });
    const files = [
      {
        path: "overwrite.txt",
        content: "after",
        description: "replace",
      },
    ];
    const result = await generateFiles(fixture.dir, files, {
      overwrite: true,
    });
    expect(result.created).toEqual(["overwrite.txt"]);
    expect(result.skipped).toEqual([]);
    expect(readFileSync(join(fixture.dir, "overwrite.txt"), "utf-8")).toBe(
      "after",
    );
  });

  it("returns empty created and skipped for an empty file list", async () => {
    fixture = await createFixture({});
    const result = await generateFiles(fixture.dir, []);
    expect(result.created).toEqual([]);
    expect(result.skipped).toEqual([]);
  });

  it("reports created and skipped counts for a mixed batch", async () => {
    fixture = await createFixture({ "exists.txt": "unchanged" });
    const files = [
      {
        path: "exists.txt",
        content: "ignored",
        description: "skip",
      },
      {
        path: "new-one.txt",
        content: "1",
        description: "new 1",
      },
      {
        path: "sub/new-two.txt",
        content: "2",
        description: "new 2",
      },
    ];
    const result = await generateFiles(fixture.dir, files);
    expect(result.created).toEqual(["new-one.txt", "sub/new-two.txt"]);
    expect(result.skipped).toEqual(["exists.txt"]);
    expect(result.created).toHaveLength(2);
    expect(result.skipped).toHaveLength(1);
    expect(readFileSync(join(fixture.dir, "exists.txt"), "utf-8")).toBe(
      "unchanged",
    );
    expect(existsSync(join(fixture.dir, "new-one.txt"))).toBe(true);
    expect(existsSync(join(fixture.dir, "sub/new-two.txt"))).toBe(true);
  });
});
