import { describe, it, expect, afterEach } from "vitest";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";
import { scanWorkspace, getWorkspacePackageDirs } from "../../../src/project-types/scanner.js";
import { chmod, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

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

  it("gracefully handles malformed package.json (unparseable)", async () => {
    fixture = await createFixture({
      "package.json": "{ this is not valid json !!!",
    });
    const result = scanWorkspace(fixture.dir);
    // malformed JSON should be caught — scanner defaults to backend unknown
    expect(result.type).toBe("backend");
    expect(result.language).toBe("unknown");
  });

  it("gracefully handles unreadable pyproject.toml for framework detection", async () => {
    fixture = await createFixture({
      "pyproject.toml": "[project]\nname = 'demo'\n",
    });
    const pyprojectPath = join(fixture.dir, "pyproject.toml");
    // Make file unreadable (chmod 0) then restore for cleanup
    chmod(pyprojectPath, 0o000, () => {
      const result = scanWorkspace(fixture!.dir);
      // pyproject.toml exists but is unreadable — still detected as Python backend
      expect(result.type).toBe("backend");
      expect(result.language).toBe("python");
      // framework should be undefined since content could not be read
      expect(result.framework).toBeUndefined();
      // Restore permissions for cleanup
      chmod(pyprojectPath, 0o644, () => {});
    });
  });

  it("gracefully handles malformed package.json with workspaces field", async () => {
    fixture = await createFixture({
      "package.json": "NOT JSON",
      "go.mod": "module demo\ngo 1.22\n",
    });
    const result = scanWorkspace(fixture.dir);
    // malformed package.json is caught, go.mod still detected
    expect(result.type).toBe("backend");
    expect(result.language).toBe("go");
  });

  it("gracefully handles non-existent directory in workspace packages", async () => {
    fixture = await createFixture({
      "package.json": JSON.stringify({
        workspaces: ["packages/nonexistent/*"],
      }),
    });
    const result = scanWorkspace(fixture.dir);
    // nonexistent workspace dirs are skipped; package.json is valid so it's detected as TS backend
    expect(result.type).toBe("backend");
    expect(result.language).toBe("typescript");
  });

  it("gracefully handles malformed Cargo.toml when checking workspace root", async () => {
    fixture = await createFixture({
      "Cargo.toml": "[package]\nname = 'demo'\n",
      "pyproject.toml": "[project]\nname = 'demo'\n",
    });
    // Normal Cargo.toml without [workspace] — should not crash
    const result = scanWorkspace(fixture.dir);
    expect(result.type).toBe("backend");
  });

  // Bug 2: Go framework detection
  it("detects Go chi framework from go.mod", async () => {
    fixture = await createFixture({
      "go.mod": "module example.com/demo\ngo 1.22\nrequire github.com/go-chi/chi v1.5.0\n",
    });
    const result = scanWorkspace(fixture.dir);
    expect(result.type).toBe("backend");
    expect(result.language).toBe("go");
    expect(result.framework).toBe("chi");
  });

  it("detects Go gin framework from go.mod", async () => {
    fixture = await createFixture({
      "go.mod": "module example.com/demo\ngo 1.22\nrequire github.com/gin-gonic/gin v1.9.0\n",
    });
    const result = scanWorkspace(fixture.dir);
    expect(result.type).toBe("backend");
    expect(result.language).toBe("go");
    expect(result.framework).toBe("gin");
  });

  it("returns undefined framework for Go project without known frameworks", async () => {
    fixture = await createFixture({
      "go.mod": "module example.com/demo\ngo 1.22\n",
    });
    const result = scanWorkspace(fixture.dir);
    expect(result.type).toBe("backend");
    expect(result.language).toBe("go");
    expect(result.framework).toBeUndefined();
  });

  // Bug 3: Python uv workspace detection
  it("detects uv workspace root from pyproject.toml with [tool.uv.workspace]", async () => {
    fixture = await createFixture({
      "pyproject.toml":
        "[project]\nname = 'workspace-root'\n\n[tool.uv.workspace]\nmembers = ['packages/*']\n",
      "packages/api/pyproject.toml":
        "[project]\nname = 'api'\ndependencies = ['fastapi']\n",
      "packages/web/pyproject.toml":
        "[project]\nname = 'web'\n",
    });
    const result = scanWorkspace(fixture.dir);
    expect(result.type).toBe("monorepo");
    expect(result.language).toContain("python");
    expect(result.subProjects).toBeDefined();
    expect(result.subProjects!.length).toBeGreaterThanOrEqual(2);
  });

  it("parses uv workspace members from pyproject.toml", async () => {
    fixture = await createFixture({
      "pyproject.toml":
        "[project]\nname = 'ws'\n\n[tool.uv.workspace]\nmembers = ['libs/*']\n",
      "libs/a/pyproject.toml": "[project]\nname = 'a'\n",
      "libs/b/pyproject.toml": "[project]\nname = 'b'\n",
    });
    const dirs = getWorkspacePackageDirs(fixture.dir);
    expect(dirs).toContain("libs/a");
    expect(dirs).toContain("libs/b");
  });
});
