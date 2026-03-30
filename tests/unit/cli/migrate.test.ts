import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runMigrate } from "../../../src/cli/migrate.js";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";

describe("runMigrate", () => {
  it("exits with error for unknown fromVersion", async () => {
    const prev = process.exitCode;
    process.exitCode = 0;
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await runMigrate({ fromVersion: "0.0.0-unknown" });
    expect(process.exitCode).toBe(1);
    err.mockRestore();
    process.exitCode = prev;
  });

  it("prints plan in dry-run for registered version", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await runMigrate({ fromVersion: "0.5.0" });
    const text = log.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(text).toContain("add-generated-files-field");
    expect(text).toContain("generated_files");
    expect(text).toContain("Dry run only");
    log.mockRestore();
  });

  it("apply adds generated_files to config when missing", async () => {
    let fx: Fixture | undefined;
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      fx = await createFixture({
        ".harness/config.yaml": `
project:
  name: demo
  type: backend
  language: typescript
tools:
  - cursor
workflows:
  commands:
    lint: echo ok
  verification:
    checks:
      - lint
custom_rules: []
`,
      });
      await runMigrate({ fromVersion: "0.5.0", apply: true, cwd: fx.dir });
      const text = log.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(text).toContain("add-generated-files-field");
      expect(text).toContain("Applied: add-generated-files-field");
      const raw = readFileSync(join(fx.dir, ".harness/config.yaml"), "utf-8");
      expect(raw).toContain("generated_files:");
    } finally {
      log.mockRestore();
      await fx?.cleanup();
    }
  });
});
