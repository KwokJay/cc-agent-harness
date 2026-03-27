import { describe, it, expect, vi } from "vitest";
import { runMigrate } from "../../../src/cli/migrate.js";

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
    expect(text).toContain("noop-baseline");
    expect(text).toContain("Dry run only");
    log.mockRestore();
  });
});
