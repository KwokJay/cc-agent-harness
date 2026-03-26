import { describe, it, expect, afterEach } from "vitest";
import { generateFiles } from "../../../src/scaffold/generator.js";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

let fixture: Fixture | undefined;

afterEach(async () => {
  await fixture?.cleanup();
  fixture = undefined;
});

describe("generateFiles incremental mode", () => {
  it("skips unchanged files", async () => {
    fixture = await createFixture({ "a.txt": "same" });
    const result = await generateFiles(
      fixture.dir,
      [{ path: "a.txt", content: "same", description: "" }],
      { mode: "incremental" },
    );
    expect(result.unchanged).toEqual(["a.txt"]);
    expect(result.updated).toEqual([]);
    expect(result.created).toEqual([]);
  });

  it("updates modified files", async () => {
    fixture = await createFixture({ "a.txt": "old" });
    const result = await generateFiles(
      fixture.dir,
      [{ path: "a.txt", content: "new", description: "" }],
      { mode: "incremental" },
    );
    expect(result.updated).toEqual(["a.txt"]);
    expect(result.unchanged).toEqual([]);
    const content = readFileSync(join(fixture.dir, "a.txt"), "utf-8");
    expect(content).toBe("new");
  });

  it("creates new files", async () => {
    fixture = await createFixture({});
    const result = await generateFiles(
      fixture.dir,
      [{ path: "new.txt", content: "hello", description: "" }],
      { mode: "incremental" },
    );
    expect(result.created).toEqual(["new.txt"]);
  });

  it("handles mixed scenario", async () => {
    fixture = await createFixture({
      "same.txt": "no change",
      "changed.txt": "v1",
    });
    const result = await generateFiles(
      fixture.dir,
      [
        { path: "same.txt", content: "no change", description: "" },
        { path: "changed.txt", content: "v2", description: "" },
        { path: "brand-new.txt", content: "fresh", description: "" },
      ],
      { mode: "incremental" },
    );
    expect(result.unchanged).toEqual(["same.txt"]);
    expect(result.updated).toEqual(["changed.txt"]);
    expect(result.created).toEqual(["brand-new.txt"]);
  });
});

describe("generateFiles dry-run mode", () => {
  it("reports changes without writing files", async () => {
    fixture = await createFixture({ "existing.txt": "old" });
    const result = await generateFiles(
      fixture.dir,
      [
        { path: "existing.txt", content: "new", description: "" },
        { path: "new-file.txt", content: "hello", description: "" },
      ],
      { mode: "incremental", dryRun: true },
    );
    expect(result.updated).toEqual(["existing.txt"]);
    expect(result.created).toEqual(["new-file.txt"]);

    const content = readFileSync(join(fixture.dir, "existing.txt"), "utf-8");
    expect(content).toBe("old");
  });

  it("dry-run in full mode does not write", async () => {
    fixture = await createFixture({});
    const result = await generateFiles(
      fixture.dir,
      [{ path: "test.txt", content: "data", description: "" }],
      { mode: "full", dryRun: true },
    );
    expect(result.created).toEqual(["test.txt"]);
    const exists = await import("node:fs").then((fs) =>
      fs.existsSync(join(fixture!.dir, "test.txt")),
    );
    expect(exists).toBe(false);
  });
});
