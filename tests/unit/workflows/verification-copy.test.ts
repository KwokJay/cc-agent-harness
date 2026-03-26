import { describe, it, expect } from "vitest";
import {
  buildVerificationSteps,
  buildVerificationCheckLines,
} from "../../../src/workflows/verification-copy.js";
import type { HarnessConfig } from "../../../src/config/schema.js";

const sampleConfig: HarnessConfig = {
  project: { name: "x", type: "backend", language: "ts" },
  tools: ["cursor"],
  workflows: {
    commands: { lint: "npm run lint", test: "npm test" },
    verification: { checks: ["lint", "test"] },
  },
  custom_rules: [],
};

describe("verification-copy", () => {
  it("buildVerificationSteps matches ordered checks", () => {
    expect(buildVerificationSteps(sampleConfig)).toEqual([
      "1. Run `npm run lint` to verify lint.",
      "2. Run `npm test` to verify test.",
    ]);
  });

  it("buildVerificationCheckLines marks missing commands", () => {
    const cfg: HarnessConfig = {
      ...sampleConfig,
      workflows: {
        commands: { lint: "npm run lint" },
        verification: { checks: ["lint", "missing"] },
      },
    };
    const lines = buildVerificationCheckLines(cfg);
    expect(lines[0]).toContain("lint");
    expect(lines[1]).toContain("missing");
    expect(lines[1]).toContain("workflows.commands");
  });
});
