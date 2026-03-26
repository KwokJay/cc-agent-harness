import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import type { GeneratedFile } from "../tool-adapters/types.js";
import type { DetectedProject } from "../project-types/types.js";

export interface ExtractedSkill {
  name: string;
  description: string;
  body: string;
  category: "technical" | "business";
}

export interface AnalysisResult {
  skills: ExtractedSkill[];
  files: GeneratedFile[];
}

export function analyzeProject(
  cwd: string,
  project: DetectedProject,
  projectName: string,
): AnalysisResult {
  const skills: ExtractedSkill[] = [];

  skills.push(...extractFromDependencies(cwd, project));
  skills.push(...extractFromDirectoryStructure(cwd, project));
  skills.push(...extractFromConfigFiles(cwd, project));
  skills.push(...extractFromTestPatterns(cwd, project));

  const files: GeneratedFile[] = [];

  for (const skill of skills) {
    const content = [
      `---`,
      `name: ${skill.name}`,
      `description: ${skill.description}`,
      `---`,
      ``,
      skill.body,
      ``,
    ].join("\n");

    files.push({
      path: `.harness/skills/${skill.name}/SKILL.md`,
      content,
      description: `Auto-extracted skill (${skill.category}): ${skill.name}`,
    });
  }

  files.push(generateProjectAnalysis(cwd, project, projectName, skills));
  files.push(generateSkillIndex(skills, projectName));
  files.push(generateExtractionTask(projectName, project, skills));

  return { skills, files };
}

export function analyzeAndExtractSkills(
  cwd: string,
  project: DetectedProject,
  projectName: string,
): GeneratedFile[] {
  return analyzeProject(cwd, project, projectName).files;
}

function extractFromDependencies(cwd: string, project: DetectedProject): ExtractedSkill[] {
  const skills: ExtractedSkill[] = [];

  if (project.language === "typescript" || project.language.includes("typescript")) {
    const pkgPath = join(cwd, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

        if (allDeps["typescript"] || existsSync(join(cwd, "tsconfig.json"))) {
          skills.push({
            name: "typescript-conventions",
            description: "TypeScript usage conventions detected from project configuration. Use when writing or reviewing TypeScript code.",
            category: "technical",
            body: buildTypeScriptSkill(cwd),
          });
        }

        const testFramework = detectTestFramework(allDeps);
        if (testFramework) {
          skills.push({
            name: `testing-${testFramework}`,
            description: `Testing conventions using ${testFramework}. Use when writing or reviewing tests.`,
            category: "technical",
            body: buildTestingSkill(testFramework, allDeps),
          });
        }

        const linter = detectLinter(allDeps, cwd);
        if (linter) {
          skills.push({
            name: `linting-${linter}`,
            description: `Linting and formatting conventions using ${linter}. Use when writing code to ensure style compliance.`,
            category: "technical",
            body: buildLintingSkill(linter),
          });
        }
      } catch { /* ignore parse errors */ }
    }
  }

  if (project.language === "python") {
    const pyprojectPath = join(cwd, "pyproject.toml");
    if (existsSync(pyprojectPath)) {
      const content = readFileSync(pyprojectPath, "utf-8");
      skills.push({
        name: "python-project-conventions",
        description: "Python project conventions extracted from pyproject.toml. Use when writing or reviewing Python code.",
        category: "technical",
        body: buildPythonSkill(content),
      });
    }
  }

  if (project.language === "go") {
    skills.push({
      name: "go-conventions",
      description: "Go project conventions. Use when writing or reviewing Go code.",
      category: "technical",
      body: [
        "# Go Conventions",
        "",
        "- Use `gofmt` / `goimports` for formatting.",
        "- Follow effective Go idioms: short variable names in small scopes, descriptive names in exported APIs.",
        "- Handle errors explicitly; do not ignore `err` returns.",
        "- Use table-driven tests.",
        "- Keep packages focused; avoid large catch-all packages.",
      ].join("\n"),
    });
  }

  if (project.language === "rust") {
    skills.push({
      name: "rust-conventions",
      description: "Rust project conventions. Use when writing or reviewing Rust code.",
      category: "technical",
      body: [
        "# Rust Conventions",
        "",
        "- Run `cargo fmt` before committing.",
        "- Run `cargo clippy` and fix all warnings.",
        "- Prefer `Result` over `panic!` for recoverable errors.",
        "- Use descriptive type names and module structure.",
        "- Write doc comments for public items.",
      ].join("\n"),
    });
  }

  if (project.language === "java") {
    skills.push({
      name: "java-conventions",
      description: "Java project conventions. Use when writing or reviewing Java code.",
      category: "technical",
      body: [
        "# Java Conventions",
        "",
        "- Follow standard Java naming: camelCase for methods, PascalCase for classes.",
        "- Use dependency injection; avoid static mutable state.",
        "- Write Javadoc for public classes and methods.",
        "- Prefer composition over inheritance.",
        "- Handle checked exceptions explicitly.",
      ].join("\n"),
    });
  }

  return skills;
}

function extractFromDirectoryStructure(cwd: string, project: DetectedProject): ExtractedSkill[] {
  const skills: ExtractedSkill[] = [];
  const dirs = safeReadDir(cwd);

  const srcDirs = dirs.filter((d) => ["src", "app", "lib", "packages", "modules", "services"].includes(d));
  if (srcDirs.length > 0) {
    const structure = srcDirs.map((d) => {
      const children = safeReadDir(join(cwd, d)).slice(0, 15);
      return `- \`${d}/\`: ${children.join(", ") || "(empty)"}`;
    });

    skills.push({
      name: "project-structure",
      description: "Project directory structure and module organization. Use when creating new files or modules to maintain consistent organization.",
      category: "technical",
      body: [
        "# Project Structure",
        "",
        "This project uses the following directory layout:",
        "",
        ...structure,
        "",
        "When creating new files:",
        "- Place source code in the appropriate existing directory.",
        "- Follow the existing naming and grouping patterns.",
        "- Do not create new top-level directories without explicit approval.",
      ].join("\n"),
    });
  }

  return skills;
}

function extractFromConfigFiles(cwd: string, _project: DetectedProject): ExtractedSkill[] {
  const skills: ExtractedSkill[] = [];

  const ciFiles = [".github/workflows", ".gitlab-ci.yml", "Jenkinsfile", ".circleci"];
  const hasCi = ciFiles.some((f) => existsSync(join(cwd, f)));
  if (hasCi) {
    skills.push({
      name: "ci-workflow",
      description: "CI/CD workflow conventions. Use when modifying build, test, or deployment pipelines.",
      category: "technical",
      body: [
        "# CI/CD Conventions",
        "",
        "This project has CI/CD pipelines configured.",
        "- Do not modify CI configuration without understanding the full pipeline.",
        "- Ensure all CI checks pass before merging.",
        "- New features should include tests that run in CI.",
      ].join("\n"),
    });
  }

  const dockerFiles = ["Dockerfile", "docker-compose.yml", "docker-compose.yaml"];
  const hasDocker = dockerFiles.some((f) => existsSync(join(cwd, f)));
  if (hasDocker) {
    skills.push({
      name: "containerization",
      description: "Docker and containerization conventions. Use when working with Docker, containers, or deployment.",
      category: "technical",
      body: [
        "# Containerization",
        "",
        "This project uses Docker.",
        "- Keep Docker images minimal; use multi-stage builds when possible.",
        "- Do not hardcode secrets in Dockerfiles.",
        "- Use `.dockerignore` to exclude unnecessary files.",
      ].join("\n"),
    });
  }

  return skills;
}

function extractFromTestPatterns(cwd: string, _project: DetectedProject): ExtractedSkill[] {
  const testDirs = ["test", "tests", "__tests__", "spec", "e2e"];
  const foundTestDirs = testDirs.filter((d) => existsSync(join(cwd, d)));

  if (foundTestDirs.length === 0) return [];

  return [{
    name: "test-organization",
    description: "Test file organization and patterns. Use when writing new tests.",
    category: "technical",
    body: [
      "# Test Organization",
      "",
      `Tests are located in: ${foundTestDirs.map((d) => `\`${d}/\``).join(", ")}`,
      "",
      "- Co-locate unit tests near the code they test when possible.",
      "- Use descriptive test names that explain the expected behavior.",
      "- Group related tests with describe/context blocks.",
      "- Keep test files focused; one test file per module or feature.",
    ].join("\n"),
  }];
}

function generateSkillIndex(skills: ExtractedSkill[], projectName: string): GeneratedFile {
  const technical = skills.filter((s) => s.category === "technical");
  const business = skills.filter((s) => s.category === "business");

  const lines = [
    `# ${projectName} - Extracted Skills Index`,
    "",
    `Auto-extracted on ${new Date().toISOString().split("T")[0]} by agent-harness.`,
    "",
  ];

  if (technical.length > 0) {
    lines.push("## Technical Skills");
    lines.push("");
    for (const s of technical) {
      lines.push(`- **${s.name}**: ${s.description.split(".")[0]}`);
    }
    lines.push("");
  }

  if (business.length > 0) {
    lines.push("## Business Skills");
    lines.push("");
    for (const s of business) {
      lines.push(`- **${s.name}**: ${s.description.split(".")[0]}`);
    }
    lines.push("");
  }

  lines.push("## AI-Powered Extraction");
  lines.push("");
  lines.push("For deeper skill extraction using your AI coding tool, the harness will");
  lines.push("automatically invoke skill-creator. See `.harness/skills/EXTRACTION-TASK.md`.");
  lines.push("");

  return {
    path: ".harness/skills/INDEX.md",
    content: lines.join("\n"),
    description: "Auto-extracted skills index",
  };
}

function generateProjectAnalysis(
  cwd: string,
  project: DetectedProject,
  projectName: string,
  skills: ExtractedSkill[],
): GeneratedFile {
  const dirs = safeReadDir(cwd);
  const allDirs = dirs.map((d) => {
    const children = safeReadDir(join(cwd, d)).slice(0, 10);
    return `- ${d}/: ${children.join(", ") || "(empty)"}`;
  });

  const lines = [
    `# Project Analysis: ${projectName}`,
    ``,
    `Generated by agent-harness static analysis on ${new Date().toISOString().split("T")[0]}.`,
    ``,
    `## Project Identity`,
    ``,
    `- **Type**: ${project.type}`,
    `- **Language**: ${project.language}`,
    project.framework ? `- **Framework**: ${project.framework}` : null,
    `- **Detection signals**: ${project.signals.join(", ")}`,
    ``,
    `## Directory Structure`,
    ``,
    ...allDirs,
    ``,
    `## Already Extracted Skills (Static Analysis)`,
    ``,
    ...skills.map((s) => `- **${s.name}** (${s.category}): ${s.description.split(".")[0]}`),
    ``,
    `## Gaps for AI Extraction`,
    ``,
    `The static analysis above only covers surface-level patterns. The following areas require reading source code:`,
    ``,
    `### Technical Gaps`,
    `- Architecture patterns and module boundaries`,
    `- Error handling conventions`,
    `- Data access and state management patterns`,
    `- Security patterns (auth, validation, sanitization)`,
    `- Performance patterns and optimization conventions`,
    ``,
    `### Business Gaps`,
    `- Domain model and entity relationships`,
    `- Business rule patterns and validation logic`,
    `- API contract conventions`,
    `- User-facing content guidelines`,
    ``,
  ];

  return {
    path: ".harness/skills/PROJECT-ANALYSIS.md",
    content: lines.filter((l) => l !== null).join("\n"),
    description: "Static analysis results for AI skill extraction",
  };
}

function generateExtractionTask(
  projectName: string,
  project: DetectedProject,
  alreadyExtracted: ExtractedSkill[],
): GeneratedFile {
  const existingList = alreadyExtracted.map((s) => `- ${s.name} (${s.category})`).join("\n");

  return {
    path: ".harness/skills/EXTRACTION-TASK.md",
    content: `# Skill Extraction Task

## Prerequisites

Before starting, you MUST read these two files:

1. **\`.harness/skills/PROJECT-ANALYSIS.md\`** — Static analysis of this project (structure, dependencies, gaps)
2. **\`.harness/skills/skill-creator/SKILL.md\`** — The skill creation standard you MUST follow

## Context

This is a skill extraction task for **${projectName}** (${project.type} / ${project.language}${project.framework ? ` / ${project.framework}` : ""}).

Static analysis has already extracted these baseline skills:

${existingList}

## Your Task

Using the \`skill-creator\` methodology, extract deeper skills from this project's actual source code.

### Step 1: Read PROJECT-ANALYSIS.md

Understand what has already been analyzed and what gaps remain.

### Step 2: Deep-Read the Project

1. Read \`README.md\` and any documentation in \`.harness/docs/\`
2. Scan the full directory tree
3. Read the main entry point and 3-5 representative source files
4. Read configuration files and build scripts
5. Read 2-3 test files to understand testing patterns
6. Read any existing API routes, controllers, or service modules

### Step 3: Extract Skills Using skill-creator

For each pattern you identify, follow the \`skill-creator\` process:

1. **Understand the intent**: What convention or pattern should this skill capture?
2. **Write the description**: Specific enough to trigger correctly — include WHEN and WHAT
3. **Write the body**: Concrete rules with real code examples from this project
4. **Validate**: Ensure frontmatter has \`name\` and \`description\`, body is under 500 lines

### Step 4: Organize by Dimension

**Technical skills** (extract if clear patterns exist):
- Architecture and module boundaries
- Error handling conventions
- Data access patterns
- State management
- Security patterns
- Performance conventions

**Business skills** (extract if domain logic exists):
- Domain model conventions
- Business rule patterns
- API contract conventions
- Data validation rules
- User-facing content guidelines

### Step 5: Write Each Skill

Create each skill as: \`.harness/skills/{name}/SKILL.md\`

Follow the format defined in \`skill-creator\`:

\`\`\`markdown
---
name: skill-name
description: What this skill captures and when to use it
---

# Skill Title

[Concrete rules and examples extracted from the actual codebase]
\`\`\`

### Step 6: Update INDEX.md

Update \`.harness/skills/INDEX.md\` with all new skills, separated by technical/business.

### Step 7: Distribute

Run \`agent-harness update\` to distribute new skills to each AI tool's native path.

## Quality Gates (from skill-creator)

- [ ] Each skill has \`name\` and \`description\` in frontmatter
- [ ] Description explains WHEN to trigger AND WHAT it enforces
- [ ] Body is actionable with real examples from this codebase
- [ ] Each skill is focused on ONE dimension
- [ ] Length is under 500 lines (use references/ for extras)
- [ ] Technical and business skills are clearly separated
- [ ] INDEX.md is updated
`,
    description: "AI-powered skill extraction task (uses skill-creator)",
  };
}

function buildTypeScriptSkill(cwd: string): string {
  const lines = ["# TypeScript Conventions", ""];
  const tsconfigPath = join(cwd, "tsconfig.json");
  if (existsSync(tsconfigPath)) {
    try {
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));
      const strict = tsconfig.compilerOptions?.strict;
      if (strict) lines.push("- Strict mode is enabled; do not use `any` unless absolutely necessary.");
      const target = tsconfig.compilerOptions?.target;
      if (target) lines.push(`- Compilation target: ${target}`);
    } catch { /* ignore */ }
  }
  lines.push("- Use explicit types for function parameters and return values.");
  lines.push("- Prefer `interface` over `type` for object shapes.");
  lines.push("- Use `const` by default; `let` only when reassignment is needed.");
  return lines.join("\n");
}

function buildTestingSkill(framework: string, _deps: Record<string, string>): string {
  const lines = [`# Testing with ${framework}`, ""];
  switch (framework) {
    case "vitest":
      lines.push("- Use `describe` and `it` blocks for test organization.");
      lines.push("- Use `expect` for assertions.");
      lines.push("- Co-locate test files with source using `.test.ts` suffix.");
      break;
    case "jest":
      lines.push("- Use `describe` and `it` blocks for test organization.");
      lines.push("- Use `expect` for assertions.");
      lines.push("- Place tests in `__tests__/` or use `.test.ts` suffix.");
      break;
    case "pytest":
      lines.push("- Use `test_` prefix for test functions.");
      lines.push("- Use `assert` statements directly.");
      lines.push("- Place tests in `tests/` directory.");
      break;
    default:
      lines.push(`- Follow ${framework} conventions for test organization.`);
  }
  return lines.join("\n");
}

function buildLintingSkill(linter: string): string {
  const lines = [`# Linting with ${linter}`, ""];
  switch (linter) {
    case "eslint":
      lines.push("- Run `eslint` before committing.");
      lines.push("- Fix auto-fixable issues with `--fix`.");
      lines.push("- Do not disable rules with inline comments unless absolutely necessary.");
      break;
    case "biome":
      lines.push("- Run `biome check` before committing.");
      lines.push("- Use `biome format` for formatting.");
      break;
    case "ruff":
      lines.push("- Run `ruff check` before committing.");
      lines.push("- Run `ruff format` for formatting.");
      break;
    default:
      lines.push(`- Follow ${linter} conventions.`);
  }
  return lines.join("\n");
}

function buildPythonSkill(pyprojectContent: string): string {
  const lines = ["# Python Project Conventions", ""];
  if (pyprojectContent.includes("ruff")) {
    lines.push("- This project uses **ruff** for linting and formatting.");
    lines.push("- Run `ruff check .` before committing.");
    lines.push("- Run `ruff format .` for formatting.");
  }
  if (pyprojectContent.includes("pytest")) {
    lines.push("- This project uses **pytest** for testing.");
    lines.push("- Run `python -m pytest` to execute tests.");
  }
  if (pyprojectContent.includes("fastapi") || pyprojectContent.includes("FastAPI")) {
    lines.push("- This project uses **FastAPI** for the API layer.");
    lines.push("- Use `async def` for route handlers.");
    lines.push("- Use Pydantic models for request/response validation.");
  }
  lines.push("- Use type hints for all function signatures.");
  lines.push("- Write docstrings for public modules and functions.");
  return lines.join("\n");
}

function detectTestFramework(deps: Record<string, string>): string | null {
  if (deps["vitest"]) return "vitest";
  if (deps["jest"]) return "jest";
  if (deps["mocha"]) return "mocha";
  if (deps["pytest"]) return "pytest";
  return null;
}

function detectLinter(deps: Record<string, string>, cwd: string): string | null {
  if (deps["@biomejs/biome"] || existsSync(join(cwd, "biome.json"))) return "biome";
  if (deps["eslint"] || existsSync(join(cwd, ".eslintrc.js")) || existsSync(join(cwd, "eslint.config.js"))) return "eslint";
  return null;
}

function safeReadDir(dir: string): string[] {
  try {
    return readdirSync(dir).filter((entry) => {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "dist" || entry === "build" || entry === "__pycache__") return false;
      try { return statSync(join(dir, entry)).isDirectory(); } catch { return false; }
    });
  } catch {
    return [];
  }
}
