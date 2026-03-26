import { describe, it, expect, afterEach } from "vitest";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";
import { scanWorkspace } from "../../../src/project-types/scanner.js";

let fixture: Fixture | undefined;

afterEach(async () => {
  await fixture?.cleanup();
  fixture = undefined;
});

describe("scanWorkspace", () => {
  it("detects TypeScript frontend when package.json has vue", async () => {
    fixture = await createFixture({
      "package.json": JSON.stringify({ dependencies: { vue: "^3.0.0" } }),
    });
    const result = scanWorkspace(fixture.dir);
    expect(result.type).toBe("frontend");
    expect(result.language).toBe("typescript");
    expect(result.framework).toBe("vue");
    expect(result.signals.some((s) => s.includes("vue"))).toBe(true);
  });

  it("detects TypeScript backend when package.json has express", async () => {
    fixture = await createFixture({
      "package.json": JSON.stringify({ dependencies: { express: "^4.0.0" } }),
    });
    const result = scanWorkspace(fixture.dir);
    expect(result.type).toBe("backend");
    expect(result.language).toBe("typescript");
    expect(result.framework).toBe("node");
    expect(result.signals).toContain("package.json with server framework");
  });

  it("detects Python backend from pyproject.toml", async () => {
    fixture = await createFixture({
      "pyproject.toml": "[project]\nname = \"demo\"\n",
    });
    const result = scanWorkspace(fixture.dir);
    expect(result.type).toBe("backend");
    expect(result.language).toBe("python");
    expect(result.signals).toContain("python project files");
  });

  it("detects Go backend from go.mod", async () => {
    fixture = await createFixture({
      "go.mod": "module example.com/demo\ngo 1.22\n",
    });
    const result = scanWorkspace(fixture.dir);
    expect(result.type).toBe("backend");
    expect(result.language).toBe("go");
    expect(result.signals).toContain("go.mod");
  });

  it("detects Rust backend from Cargo.toml", async () => {
    fixture = await createFixture({
      "Cargo.toml": '[package]\nname = "demo"\nversion = "0.1.0"\nedition = "2021"\n',
    });
    const result = scanWorkspace(fixture.dir);
    expect(result.type).toBe("backend");
    expect(result.language).toBe("rust");
    expect(result.signals).toContain("Cargo.toml");
  });

  it("detects Java backend from pom.xml", async () => {
    fixture = await createFixture({
      "pom.xml":
        '<?xml version="1.0"?><project><modelVersion>4.0.0</modelVersion></project>',
    });
    const result = scanWorkspace(fixture.dir);
    expect(result.type).toBe("backend");
    expect(result.language).toBe("java");
    expect(result.framework).toBe("maven");
    expect(result.signals.some((s) => s.includes("java"))).toBe(true);
  });

  it("detects docs project from mkdocs.yml", async () => {
    fixture = await createFixture({
      "mkdocs.yml": "site_name: Demo\n",
    });
    const result = scanWorkspace(fixture.dir);
    expect(result.type).toBe("docs");
    expect(result.language).toBe("markdown");
    expect(result.signals).toContain("documentation framework config");
  });

  it("defaults to backend unknown when no signals", async () => {
    fixture = await createFixture({
      "README.md": "# empty\n",
    });
    const result = scanWorkspace(fixture.dir);
    expect(result.type).toBe("backend");
    expect(result.language).toBe("unknown");
    expect(result.signals).toContain("no markers detected, defaulting to backend");
  });

  it("detects monorepo when pnpm-workspace.yaml has multiple frontend packages", async () => {
    fixture = await createFixture({
      "pnpm-workspace.yaml": "packages:\n  - 'packages/*'\n",
      "packages/web/package.json": JSON.stringify({
        dependencies: { vue: "^3.0.0" },
      }),
      "packages/app/package.json": JSON.stringify({
        dependencies: { vue: "^3.0.0" },
      }),
    });
    const result = scanWorkspace(fixture.dir);
    expect(result.type).toBe("monorepo");
    expect(result.framework).toBe("pnpm");
    expect(result.subProjects).toHaveLength(2);
    expect(result.signals.some((s) => s.includes("sub-project"))).toBe(true);
  });
});
