import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import type { DetectedProject, SubProject, ProjectTypeId } from "./types.js";

interface LanguageSignal {
  language: string;
  framework?: string;
  type: ProjectTypeId;
  signals: string[];
}

export function scanWorkspace(cwd: string): DetectedProject {
  const workspace = isWorkspaceRoot(cwd);
  const subProjects = scanSubDirectories(cwd);

  if (workspace && subProjects.length > 0) {
    const types = new Set(subProjects.map((s) => s.type));
    const languages = [...new Set(subProjects.map((s) => s.language))];

    if (types.has("frontend") && types.has("backend")) {
      return {
        type: "fullstack",
        language: languages.join("+"),
        framework: detectWorkspaceFramework(cwd),
        signals: [`workspace with ${subProjects.length} sub-project(s)`],
        subProjects,
      };
    }
    return {
      type: "monorepo",
      language: languages.join("+"),
      framework: detectWorkspaceFramework(cwd),
      signals: [`workspace with ${subProjects.length} sub-project(s)`],
      subProjects,
    };
  }

  if (subProjects.length >= 2) {
    const types = new Set(subProjects.map((s) => s.type));
    const languages = [...new Set(subProjects.map((s) => s.language))];
    return {
      type: types.has("frontend") && types.has("backend") ? "fullstack" : "monorepo",
      language: languages.join("+"),
      signals: [`${subProjects.length} sub-project(s) detected`],
      subProjects,
    };
  }

  const rootDetection = detectSingleProject(cwd);
  if (rootDetection) {
    if (subProjects.length > 0) {
      return { ...rootDetection, subProjects };
    }
    return rootDetection;
  }

  return { type: "backend", language: "unknown", signals: ["no markers detected, defaulting to backend"] };
}

function scanSubDirectories(cwd: string): SubProject[] {
  const subs: SubProject[] = [];
  const scanDirs = getWorkspacePackageDirs(cwd);

  for (const dir of scanDirs) {
    const absDir = join(cwd, dir);
    if (!existsSync(absDir) || !statSync(absDir).isDirectory()) continue;

    const detection = detectSingleProject(absDir);
    if (detection) {
      subs.push({
        path: dir,
        name: basename(dir),
        type: detection.type,
        language: detection.language,
        framework: detection.framework,
        signals: detection.signals,
      });
    }
  }

  return subs;
}

/** Package paths relative to workspace root (pnpm / npm workspaces); used by skill extraction and monorepo tooling. */
export function getWorkspacePackageDirs(cwd: string): string[] {
  const dirs = new Set<string>();

  const pnpmWs = join(cwd, "pnpm-workspace.yaml");
  if (existsSync(pnpmWs)) {
    const content = readFileSync(pnpmWs, "utf-8");
    const lines = content.split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*-\s+['"]?([^'"]+?)['"]?\s*$/);
      if (match) {
        const pattern = match[1].replace(/\/?\*+$/, "");
        if (pattern) {
          expandGlob(cwd, pattern).forEach((d) => dirs.add(d));
        }
      }
    }
  }

  const pkgPath = join(cwd, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (Array.isArray(pkg.workspaces)) {
        for (const pattern of pkg.workspaces) {
          const dir = pattern.replace(/\/\*$/, "");
          expandGlob(cwd, dir).forEach((d) => dirs.add(d));
        }
      }
    } catch { /* ignore */ }
  }

  if (dirs.size === 0) {
    try {
      const entries = readdirSync(cwd);
      for (const entry of entries) {
        if (entry.startsWith(".") || entry === "node_modules" || entry === "dist" || entry === "build" || entry === "__pycache__") continue;
        const abs = join(cwd, entry);
        if (statSync(abs).isDirectory()) {
          dirs.add(entry);
        }
      }
    } catch { /* ignore */ }
  }

  return [...dirs];
}

function expandGlob(cwd: string, pattern: string): string[] {
  const absDir = join(cwd, pattern);
  if (existsSync(absDir) && statSync(absDir).isDirectory()) {
    try {
      const children = readdirSync(absDir)
        .filter((entry) => {
          const abs = join(absDir, entry);
          return statSync(abs).isDirectory() && !entry.startsWith(".");
        });
      if (children.length > 0) {
        return children.map((entry) => `${pattern}/${entry}`);
      }
    } catch { /* ignore */ }
    return [pattern];
  }
  return [];
}

function detectSingleProject(dir: string): DetectedProject | null {
  const signals: LanguageSignal[] = [];

  if (existsSync(join(dir, "package.json"))) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      const framework = detectJsFramework(deps);
      const isFrontend = framework && ["react", "vue", "next", "nuxt", "svelte", "angular"].includes(framework);
      const isBackend = deps["express"] || deps["fastify"] || deps["hono"] || deps["koa"] || deps["nestjs"] || deps["@nestjs/core"];

      if (isFrontend && isBackend) {
        signals.push({ language: "typescript", framework, type: "fullstack", signals: [`package.json with ${framework} + server framework`] });
      } else if (isFrontend) {
        signals.push({ language: "typescript", framework, type: "frontend", signals: [`package.json with ${framework}`] });
      } else if (isBackend) {
        signals.push({ language: "typescript", framework: "node", type: "backend", signals: ["package.json with server framework"] });
      } else {
        signals.push({ language: "typescript", type: "backend", signals: ["package.json"] });
      }
    } catch { /* ignore */ }
  }

  if (existsSync(join(dir, "pyproject.toml")) || existsSync(join(dir, "setup.py")) || existsSync(join(dir, "requirements.txt"))) {
    let framework: string | undefined;
    if (existsSync(join(dir, "pyproject.toml"))) {
      try {
        const content = readFileSync(join(dir, "pyproject.toml"), "utf-8");
        if (content.includes("fastapi") || content.includes("FastAPI")) framework = "fastapi";
        else if (content.includes("django")) framework = "django";
        else if (content.includes("flask")) framework = "flask";
      } catch { /* ignore */ }
    }
    signals.push({ language: "python", framework, type: "backend", signals: ["python project files"] });
  }

  if (existsSync(join(dir, "go.mod"))) {
    signals.push({ language: "go", type: "backend", signals: ["go.mod"] });
  }

  if (existsSync(join(dir, "Cargo.toml"))) {
    signals.push({ language: "rust", type: "backend", signals: ["Cargo.toml"] });
  }

  if (existsSync(join(dir, "pom.xml")) || existsSync(join(dir, "build.gradle")) || existsSync(join(dir, "build.gradle.kts"))) {
    const framework = existsSync(join(dir, "pom.xml")) ? "maven" : "gradle";
    signals.push({ language: "java", framework, type: "backend", signals: [`java ${framework} project`] });
  }

  if (existsSync(join(dir, "Package.swift"))) {
    signals.push({ language: "swift", type: "backend", signals: ["Package.swift"] });
  }

  if (existsSync(join(dir, "mix.exs"))) {
    signals.push({ language: "elixir", type: "backend", signals: ["mix.exs"] });
  }

  if (existsSync(join(dir, "pubspec.yaml"))) {
    signals.push({ language: "dart", framework: "flutter", type: "frontend", signals: ["pubspec.yaml"] });
  }

  if (existsSync(join(dir, "Gemfile"))) {
    signals.push({ language: "ruby", type: "backend", signals: ["Gemfile"] });
  }

  if (existsSync(join(dir, "composer.json"))) {
    signals.push({ language: "php", type: "backend", signals: ["composer.json"] });
  }

  if (existsSync(join(dir, "build.zig")) || existsSync(join(dir, "build.zig.zon"))) {
    signals.push({ language: "zig", type: "backend", signals: ["build.zig"] });
  }

  if (existsSync(join(dir, "mkdocs.yml")) || existsSync(join(dir, "docusaurus.config.js")) || existsSync(join(dir, "docusaurus.config.ts")) || existsSync(join(dir, "book.toml"))) {
    signals.push({ language: "markdown", type: "docs", signals: ["documentation framework config"] });
  }

  if (signals.length === 0) return null;

  if (signals.length === 1) {
    const s = signals[0];
    return { type: s.type, language: s.language, framework: s.framework, signals: s.signals };
  }

  const hasFrontend = signals.some((s) => s.type === "frontend");
  const hasBackend = signals.some((s) => s.type === "backend");
  const allLangs = [...new Set(signals.map((s) => s.language))];
  const allSignals = signals.flatMap((s) => s.signals);

  if (hasFrontend && hasBackend) {
    return { type: "fullstack", language: allLangs.join("+"), signals: allSignals };
  }

  const primary = signals[0];
  return { type: primary.type, language: allLangs.join("+"), framework: primary.framework, signals: allSignals };
}

function isWorkspaceRoot(cwd: string): boolean {
  if (existsSync(join(cwd, "pnpm-workspace.yaml"))) return true;
  if (existsSync(join(cwd, "lerna.json"))) return true;
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf-8"));
    if (pkg.workspaces) return true;
  } catch { /* ignore */ }
  const cargoPath = join(cwd, "Cargo.toml");
  if (existsSync(cargoPath)) {
    try {
      if (readFileSync(cargoPath, "utf-8").includes("[workspace]")) return true;
    } catch { /* ignore */ }
  }
  return false;
}

function detectWorkspaceFramework(cwd: string): string | undefined {
  if (existsSync(join(cwd, "pnpm-workspace.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "lerna.json"))) return "lerna";
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf-8"));
    if (pkg.workspaces) return "npm-workspaces";
  } catch { /* ignore */ }
  if (existsSync(join(cwd, "Cargo.toml"))) return "cargo";
  return undefined;
}

function detectJsFramework(deps: Record<string, string>): string | null {
  if (deps["next"]) return "next";
  if (deps["nuxt"]) return "nuxt";
  if (deps["@sveltejs/kit"] || deps["svelte"]) return "svelte";
  if (deps["vue"]) return "vue";
  if (deps["react"]) return "react";
  if (deps["@angular/core"]) return "angular";
  return null;
}
