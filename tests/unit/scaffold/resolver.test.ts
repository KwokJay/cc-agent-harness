import { describe, it, expect, afterEach } from "vitest";
import { resolve } from "../../../src/scaffold/resolver.js";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";

const backendPkg = {
  "package.json":
    '{"name":"test","dependencies":{"express":"^4.0.0"},"devDependencies":{"typescript":"^5.0.0"}}',
};

let fixture: Fixture | undefined;

afterEach(async () => {
  await fixture?.cleanup();
  fixture = undefined;
});

describe("resolve", () => {
  it("backend project with cursor generates expected harness and cursor file types", async () => {
    fixture = await createFixture(backendPkg);
    const plan = resolve({
      cwd: fixture.dir,
      projectName: "api-svc",
      projectType: "backend",
      tools: ["cursor"],
    });
    const paths = plan.files.map((f) => f.path);

    expect(paths).toContain("AGENTS.md");
    expect(paths).toContain(".harness/config.yaml");
    expect(paths).toContain(".cursor/rules/project.mdc");
    expect(paths).toContain(".cursor/rules/coding.mdc");
    expect(paths.some((p) => p.startsWith(".cursor/rules/skill-") && p.endsWith(".mdc"))).toBe(
      true,
    );
    expect(paths).toContain(".harness/skills/api-conventions/SKILL.md");
    expect(paths).toContain("CHANGELOG.md");
    expect(paths).toContain(".harness/docs/README.md");
    expect(paths).toContain(".harness/skills/docs-governance/SKILL.md");
  });

  it("frontend project with claude-code generates CLAUDE.md", async () => {
    fixture = await createFixture({
      "package.json":
        '{"name":"fe","dependencies":{"react":"^18.0.0"},"devDependencies":{"typescript":"^5.0.0"}}',
    });
    const plan = resolve({
      cwd: fixture.dir,
      projectName: "web-app",
      projectType: "frontend",
      tools: ["claude-code"],
    });
    const paths = plan.files.map((f) => f.path);

    expect(paths).toContain("CLAUDE.md");
    expect(paths.some((p) => p.startsWith(".claude/skills/") && p.endsWith("SKILL.md"))).toBe(true);
  });

  it("multiple tools produce outputs for each tool", async () => {
    fixture = await createFixture(backendPkg);
    const plan = resolve({
      cwd: fixture.dir,
      projectName: "multi",
      projectType: "backend",
      tools: ["cursor", "claude-code"],
    });
    const paths = plan.files.map((f) => f.path);

    expect(paths).toContain(".cursor/rules/project.mdc");
    expect(paths).toContain("CLAUDE.md");
  });

  it("skills include preset and statically extracted skill names", async () => {
    fixture = await createFixture({
      "package.json":
        '{"name":"fe","dependencies":{"react":"^18.0.0"},"devDependencies":{"typescript":"^5.0.0"}}',
    });
    const plan = resolve({
      cwd: fixture.dir,
      projectName: "fe-proj",
      projectType: "frontend",
      tools: [],
    });

    expect(plan.skills).toContain("frontend-conventions");
    expect(plan.skills).toContain("typescript-conventions");
    expect(plan.skills.indexOf("frontend-conventions")).toBeLessThan(
      plan.skills.indexOf("typescript-conventions"),
    );
  });

  it("skipDocs omits docs directory and docs governance skill files", async () => {
    fixture = await createFixture(backendPkg);
    const plan = resolve({
      cwd: fixture.dir,
      projectName: "nodocs",
      projectType: "backend",
      tools: [],
      skipDocs: true,
    });
    const paths = plan.files.map((f) => f.path);

    expect(paths).not.toContain(".harness/docs/README.md");
    expect(paths).not.toContain(".harness/skills/docs-governance/SKILL.md");
    expect(plan.files.find((f) => f.path === ".harness/config.yaml")?.content).toContain(
      "skip_docs",
    );
  });

  it("extraRules are appended to customRules", async () => {
    fixture = await createFixture(backendPkg);
    const extra = "Never commit secrets to the repository";
    const plan = resolve({
      cwd: fixture.dir,
      projectName: "rules",
      projectType: "backend",
      tools: [],
      extraRules: [extra],
    });

    expect(plan.customRules[plan.customRules.length - 1]).toBe(extra);
    expect(plan.customRules.length).toBeGreaterThan(1);
  });

  it("does not emit duplicate file paths", async () => {
    fixture = await createFixture(backendPkg);
    const plan = resolve({
      cwd: fixture.dir,
      projectName: "dedupe",
      projectType: "backend",
      tools: ["cursor", "claude-code", "copilot"],
    });
    const paths = plan.files.map((f) => f.path);
    const unique = new Set(paths);

    expect(unique.size).toBe(paths.length);
  });
});
