import { describe, it, expect, afterEach } from "vitest";
import { ClaudeCodeAdapter } from "../../../src/tool-adapters/claude-code.js";
import type {
  ToolAdapterContext,
  SkillContent,
} from "../../../src/tool-adapters/types.js";
import { TOOL_CAPABILITIES } from "../../../src/tool-adapters/index.js";
import type { DetectedProject } from "../../../src/project-types/types.js";

const project: DetectedProject = {
  type: "frontend",
  language: "typescript",
  framework: "vue",
  signals: [],
};

function ctx(
  overrides: Partial<ToolAdapterContext> = {},
): ToolAdapterContext {
  return {
    projectName: "Demo App",
    project,
    agentsMdContent: "agents",
    commands: { lint: "pnpm lint", test: "pnpm test" },
    verificationChecks: [],
    customRules: [],
    skills: [],
    skillContents: [],
    ...overrides,
  };
}

describe("ClaudeCodeAdapter", () => {
  it("exposes first-class capability with automated extraction", () => {
    const adapter = new ClaudeCodeAdapter();
    expect(adapter.capability).toStrictEqual(TOOL_CAPABILITIES["claude-code"]);
    expect(adapter.capability.tier).toBe("first-class");
    expect(adapter.capability.extractionAuto).toBe(true);
    expect(adapter.capability.mcp).toBe(false);
  });

  it("generates CLAUDE.md with project name and @AGENTS.md reference", () => {
    const adapter = new ClaudeCodeAdapter();
    const [claude] = adapter.generate(ctx());
    expect(claude.path).toBe("CLAUDE.md");
    expect(claude.content).toContain("# Demo App");
    expect(claude.content).toContain("Read @AGENTS.md");
  });

  it("includes project type and language in CLAUDE.md", () => {
    const adapter = new ClaudeCodeAdapter();
    const [claude] = adapter.generate(ctx());
    expect(claude.content).toContain("- **Type**: frontend");
    expect(claude.content).toContain("- **Language**: typescript");
    expect(claude.content).toContain("- **Framework**: vue");
  });

  it("generates verify command when verification checks exist", () => {
    const adapter = new ClaudeCodeAdapter();
    const files = adapter.generate(
      ctx({
        verificationChecks: ["lint", "test"],
      }),
    );
    const verify = files.find((f) => f.path === ".claude/commands/verify.md");
    expect(verify).toBeDefined();
    expect(verify!.content).toContain("pnpm lint && pnpm test");
  });

  it("does not generate verify command when there are no checks", () => {
    const adapter = new ClaudeCodeAdapter();
    const files = adapter.generate(ctx({ verificationChecks: [] }));
    expect(
      files.some((f) => f.path === ".claude/commands/verify.md"),
    ).toBe(false);
  });

  it("writes each skill under .claude/skills/{name}/SKILL.md", () => {
    const skillContents: SkillContent[] = [
      { name: "alpha", description: "Alpha skill", body: "# Alpha\n" },
      { name: "beta", description: "Beta skill", body: "# Beta\n" },
    ];
    const adapter = new ClaudeCodeAdapter();
    const files = adapter.generate(ctx({ skillContents }));
    const skillFiles = files.filter((f) => f.path.includes("/skills/"));
    expect(skillFiles.map((f) => f.path).sort()).toEqual([
      ".claude/skills/alpha/SKILL.md",
      ".claude/skills/beta/SKILL.md",
    ]);
  });

  it("emits 1 + (1 if checks) + skillContents.length files", () => {
    const adapter = new ClaudeCodeAdapter();
    const skillContents: SkillContent[] = [
      { name: "one", description: "d1", body: "b1" },
      { name: "two", description: "d2", body: "b2" },
    ];
    const noChecks = adapter.generate(
      ctx({ verificationChecks: [], skillContents }),
    );
    expect(noChecks).toHaveLength(1 + skillContents.length);

    const withChecks = adapter.generate(
      ctx({ verificationChecks: ["lint"], skillContents }),
    );
    expect(withChecks).toHaveLength(2 + skillContents.length);
  });

  it("includes YAML frontmatter with name and description in skill files", () => {
    const skillContents: SkillContent[] = [
      {
        name: "my-skill",
        description: "When to use this skill.",
        body: "# Body\n",
      },
    ];
    const adapter = new ClaudeCodeAdapter();
    const files = adapter.generate(ctx({ skillContents }));
    const skillFile = files.find(
      (f) => f.path === ".claude/skills/my-skill/SKILL.md",
    );
    expect(skillFile).toBeDefined();
    expect(skillFile!.content).toMatch(/^---\nname: my-skill\n/);
    expect(skillFile!.content).toContain(
      "description: When to use this skill.",
    );
    expect(skillFile!.content).toContain("# Body");
  });
});
