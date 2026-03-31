import { describe, it, expect } from "vitest";
import {
  buildBacktickVerificationLines,
  buildClaudeVerificationLines,
  buildVerifyCommand,
  buildProjectRuleContext,
} from "../../../src/tool-adapters/shared.js";
import type { ToolAdapterContext } from "../../../src/tool-adapters/types.js";

function makeCtx(overrides: Partial<ToolAdapterContext> = {}): ToolAdapterContext {
  return {
    projectName: "test-project",
    project: { type: "backend", language: "go", framework: undefined, signals: [] },
    agentsMdContent: "",
    commands: { test: "go test ./...", lint: "go vet ./..." },
    verificationChecks: ["test", "lint"],
    customRules: ["Follow Go conventions"],
    skills: [],
    skillContents: [],
    ...overrides,
  };
}

describe("buildBacktickVerificationLines", () => {
  it("maps verification checks to backtick-wrapped commands", () => {
    const ctx = makeCtx();
    const lines = buildBacktickVerificationLines(ctx);
    expect(lines).toEqual(["`go test ./...`", "`go vet ./...`"]);
  });

  it("falls back to check name when command is missing", () => {
    const ctx = makeCtx({
      commands: {},
      verificationChecks: ["build"],
    });
    const lines = buildBacktickVerificationLines(ctx);
    expect(lines).toEqual(["`build`"]);
  });

  it("returns empty array when no verification checks", () => {
    const ctx = makeCtx({ verificationChecks: [] });
    const lines = buildBacktickVerificationLines(ctx);
    expect(lines).toEqual([]);
  });
});

describe("buildClaudeVerificationLines", () => {
  it("maps verification checks with Run prefix", () => {
    const ctx = makeCtx();
    const lines = buildClaudeVerificationLines(ctx);
    expect(lines).toEqual(["Run `go test ./...`", "Run `go vet ./...`"]);
  });

  it("falls back to check name when command is missing", () => {
    const ctx = makeCtx({
      commands: {},
      verificationChecks: ["build"],
    });
    const lines = buildClaudeVerificationLines(ctx);
    expect(lines).toEqual(["Run `build`"]);
  });
});

describe("buildVerifyCommand", () => {
  it("joins commands with &&", () => {
    const ctx = makeCtx();
    const cmd = buildVerifyCommand(ctx);
    expect(cmd).toBe("go test ./... && go vet ./...");
  });

  it("returns empty string for empty verification checks", () => {
    const ctx = makeCtx({ verificationChecks: [] });
    const cmd = buildVerifyCommand(ctx);
    expect(cmd).toBe("");
  });

  it("falls back to check name when command is missing", () => {
    const ctx = makeCtx({
      commands: {},
      verificationChecks: ["build"],
    });
    const cmd = buildVerifyCommand(ctx);
    expect(cmd).toBe("build");
  });
});

describe("buildProjectRuleContext", () => {
  it("returns complete context with all expected fields", () => {
    const ctx = makeCtx();
    const context = buildProjectRuleContext(ctx);

    expect(context.projectName).toBe("test-project");
    expect(context.project).toEqual({
      type: "backend",
      language: "go",
      framework: undefined,
    });
    expect(context.customRules).toEqual(["Follow Go conventions"]);
    expect(context.verificationLines).toEqual(["`go test ./...`", "`go vet ./...`"]);
    expect(typeof context.docsConstraint).toBe("string");
    expect(context.docsConstraint.length).toBeGreaterThan(0);
    expect(typeof context.changelogConstraint).toBe("string");
    expect(context.changelogConstraint.length).toBeGreaterThan(0);
  });

  it("includes framework when present", () => {
    const ctx = makeCtx({
      project: { type: "frontend", language: "typescript", framework: "vue", signals: [] },
    });
    const context = buildProjectRuleContext(ctx);
    expect(context.project).toEqual({
      type: "frontend",
      language: "typescript",
      framework: "vue",
    });
  });
});
