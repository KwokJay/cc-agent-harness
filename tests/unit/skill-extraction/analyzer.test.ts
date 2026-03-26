import { describe, it, expect, afterEach } from "vitest";
import { analyzeProject } from "../../../src/skill-extraction/analyzer.js";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";
import type { DetectedProject } from "../../../src/project-types/types.js";
import type { GeneratedFile } from "../../../src/tool-adapters/types.js";

let fixture: Fixture | undefined;

afterEach(async () => {
  await fixture?.cleanup();
  fixture = undefined;
});

const tsDetected: DetectedProject = {
  type: "frontend",
  language: "typescript",
  signals: [],
};

function sortedPaths(files: GeneratedFile[]) {
  return files.map((f) => f.path).sort();
}

describe("analyzeProject", () => {
  it("extracts typescript-conventions for a TypeScript project", async () => {
    fixture = await createFixture({
      "package.json": '{"devDependencies":{"typescript":"^5.0.0"}}',
    });
    const { skills } = analyzeProject(fixture.dir, tsDetected, "ts-proj");
    expect(skills.map((s) => s.name)).toContain("typescript-conventions");
  });

  it("extracts testing-vitest when vitest is a dependency", async () => {
    fixture = await createFixture({
      "package.json":
        '{"devDependencies":{"typescript":"^5.0.0","vitest":"^1.0.0"}}',
    });
    const { skills } = analyzeProject(fixture.dir, tsDetected, "vitest-proj");
    expect(skills.map((s) => s.name)).toContain("testing-vitest");
  });

  it("extracts linting-eslint when eslint is a dependency", async () => {
    fixture = await createFixture({
      "package.json":
        '{"devDependencies":{"typescript":"^5.0.0","eslint":"^8.0.0"}}',
    });
    const { skills } = analyzeProject(fixture.dir, tsDetected, "eslint-proj");
    expect(skills.map((s) => s.name)).toContain("linting-eslint");
  });

  it("extracts project-structure when src/ exists", async () => {
    fixture = await createFixture({ "src/index.ts": "" });
    const { skills } = analyzeProject(
      fixture.dir,
      { type: "backend", language: "go", signals: [] },
      "struct-proj",
    );
    expect(skills.map((s) => s.name)).toContain("project-structure");
  });

  it("extracts ci-workflow when .github/workflows is present", async () => {
    fixture = await createFixture({ ".github/workflows/ci.yml": "" });
    const { skills } = analyzeProject(
      fixture.dir,
      { type: "backend", language: "go", signals: [] },
      "ci-proj",
    );
    expect(skills.map((s) => s.name)).toContain("ci-workflow");
  });

  it("extracts containerization when Dockerfile exists", async () => {
    fixture = await createFixture({ Dockerfile: "FROM node:22\n" });
    const { skills } = analyzeProject(
      fixture.dir,
      { type: "backend", language: "go", signals: [] },
      "docker-proj",
    );
    expect(skills.map((s) => s.name)).toContain("containerization");
  });

  it("extracts test-organization when tests/ exists", async () => {
    fixture = await createFixture({ "tests/example.test.ts": "" });
    const { skills } = analyzeProject(
      fixture.dir,
      { type: "backend", language: "go", signals: [] },
      "test-proj",
    );
    expect(skills.map((s) => s.name)).toContain("test-organization");
  });

  it("includes workspace packages in PROJECT-ANALYSIS for monorepo", async () => {
    fixture = await createFixture({
      "pnpm-workspace.yaml": "packages:\n  - 'packages/*'\n",
      "packages/a/package.json": "{}",
      "packages/b/package.json": "{}",
    });
    const monorepo: DetectedProject = {
      type: "monorepo",
      language: "typescript",
      framework: "pnpm",
      signals: ["pnpm-workspace.yaml"],
    };
    const { files } = analyzeProject(fixture.dir, monorepo, "mono");
    const analysis = files.find((f) => f.path === ".harness/skills/PROJECT-ANALYSIS.md");
    expect(analysis?.content).toContain("Workspace packages");
    expect(analysis?.content).toContain("packages/a");
  });

  it("always emits PROJECT-ANALYSIS.md, INDEX.md, and EXTRACTION-TASK.md", async () => {
    fixture = await createFixture({});
    const { files } = analyzeProject(
      fixture.dir,
      { type: "docs", language: "markdown", signals: [] },
      "minimal",
    );
    expect(sortedPaths(files)).toEqual(
      [
        ".harness/skills/EXTRACTION-TASK.md",
        ".harness/skills/INDEX.md",
        ".harness/skills/PROJECT-ANALYSIS.md",
      ].sort(),
    );
  });

  it("extracts go-conventions for Go language projects", async () => {
    fixture = await createFixture({});
    const { skills } = analyzeProject(
      fixture.dir,
      { type: "backend", language: "go", signals: [] },
      "go-proj",
    );
    expect(skills.map((s) => s.name)).toContain("go-conventions");
  });

  it("marks every extracted skill as technical", async () => {
    fixture = await createFixture({
      "package.json": JSON.stringify({
        devDependencies: {
          typescript: "^5.0.0",
          vitest: "^1.0.0",
          eslint: "^8.0.0",
        },
      }),
      "tsconfig.json": '{"compilerOptions":{"strict":true,"target":"ES2022"}}',
      "src/index.ts": "",
      ".github/workflows/ci.yml": "",
      "tests/example.test.ts": "",
      Dockerfile: "FROM scratch\n",
    });
    const { skills } = analyzeProject(fixture.dir, tsDetected, "full");
    expect(skills.length).toBeGreaterThan(0);
    expect(skills.every((s) => s.category === "technical")).toBe(true);
  });

  it("covers the combined fixture with expected skill names", async () => {
    fixture = await createFixture({
      "package.json": JSON.stringify({
        devDependencies: {
          typescript: "^5.0.0",
          vitest: "^1.0.0",
          eslint: "^8.0.0",
        },
      }),
      "tsconfig.json": '{"compilerOptions":{"strict":true,"target":"ES2022"}}',
      "src/index.ts": "",
      ".github/workflows/ci.yml": "",
      "tests/example.test.ts": "",
      Dockerfile: "FROM scratch\n",
    });
    const { skills, files } = analyzeProject(fixture.dir, tsDetected, "full");
    const names = skills.map((s) => s.name).sort();
    expect(names).toEqual(
      [
        "ci-workflow",
        "containerization",
        "linting-eslint",
        "project-structure",
        "test-organization",
        "testing-vitest",
        "typescript-conventions",
      ].sort(),
    );
    expect(files).toHaveLength(skills.length + 3);
  });
});
