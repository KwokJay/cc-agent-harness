import { describe, it, expect, afterEach } from "vitest";
import { AuditLogger } from "./logger.js";
import { readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("AuditLogger", () => {
  const testDir = join(tmpdir(), `harness-audit-test-${Date.now()}`);

  afterEach(async () => {
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true });
    }
  });

  it("creates log directory and writes JSONL entry", async () => {
    const logger = new AuditLogger(testDir);
    await logger.log("setup", "Harness initialized");

    const logPath = logger.getLogPath();
    expect(existsSync(logPath)).toBe(true);

    const content = await readFile(logPath, "utf-8");
    const entry = JSON.parse(content.trim());
    expect(entry.kind).toBe("setup");
    expect(entry.message).toBe("Harness initialized");
    expect(entry.timestamp).toBeDefined();
  });

  it("appends multiple entries", async () => {
    const logger = new AuditLogger(testDir);
    await logger.log("setup", "First");
    await logger.log("doctor", "Second");

    const content = await readFile(logger.getLogPath(), "utf-8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).kind).toBe("setup");
    expect(JSON.parse(lines[1]).kind).toBe("doctor");
  });

  it("includes optional data field", async () => {
    const logger = new AuditLogger(testDir);
    await logger.log("config.changed", "Config updated", { key: "project.name", value: "test" });

    const content = await readFile(logger.getLogPath(), "utf-8");
    const entry = JSON.parse(content.trim());
    expect(entry.data).toEqual({ key: "project.name", value: "test" });
  });
});
