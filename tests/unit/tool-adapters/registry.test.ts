import { describe, it, expect } from "vitest";
import { ALL_TOOL_IDS, TOOL_CAPABILITIES, listToolAdapters, getToolCapability } from "../../../src/tool-adapters/index.js";
import type { ToolId } from "../../../src/tool-adapters/types.js";

const EXPECTED_IDS: ToolId[] = [
  "cursor",
  "claude-code",
  "copilot",
  "codex",
  "opencode",
  "windsurf",
  "trae",
  "augment",
];

describe("Adapter self-registration (D6)", () => {
  it("ALL_TOOL_IDS contains all 8 adapter IDs", () => {
    expect(ALL_TOOL_IDS).toHaveLength(8);
    for (const id of EXPECTED_IDS) {
      expect(ALL_TOOL_IDS).toContain(id);
    }
  });

  it("TOOL_CAPABILITIES has an entry for every adapter", () => {
    for (const id of EXPECTED_IDS) {
      expect(TOOL_CAPABILITIES[id]).toBeDefined();
    }
  });

  it("each TOOL_CAPABILITIES entry matches its adapter's capability", () => {
    const adapters = listToolAdapters();
    for (const adapter of adapters) {
      expect(TOOL_CAPABILITIES[adapter.id]).toStrictEqual(adapter.capability);
    }
  });

  it("getToolCapability returns the correct capability for each tool", () => {
    const adapters = listToolAdapters();
    for (const adapter of adapters) {
      expect(getToolCapability(adapter.id)).toStrictEqual(adapter.capability);
    }
  });

  it("every adapter has a non-empty setupSummary", () => {
    const adapters = listToolAdapters();
    for (const adapter of adapters) {
      expect(adapter.setupSummary).toBeDefined();
      expect(typeof adapter.setupSummary).toBe("string");
      expect(adapter.setupSummary.length).toBeGreaterThan(0);
    }
  });
});
