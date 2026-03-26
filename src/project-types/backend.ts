import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ProjectTypeAdapter, DetectedProject, WorkflowCommands } from "./types.js";

export class BackendAdapter implements ProjectTypeAdapter {
  id = "backend" as const;
  label = "Backend";

  detect(cwd: string): DetectedProject | null {
    if (existsSync(join(cwd, "pyproject.toml")) || existsSync(join(cwd, "setup.py")) || existsSync(join(cwd, "requirements.txt"))) {
      return { type: "backend", language: "python", signals: ["python project files"] };
    }
    if (existsSync(join(cwd, "go.mod"))) {
      return { type: "backend", language: "go", signals: ["go.mod"] };
    }
    if (existsSync(join(cwd, "Cargo.toml"))) {
      return { type: "backend", language: "rust", signals: ["Cargo.toml"] };
    }
    if (existsSync(join(cwd, "pom.xml")) || existsSync(join(cwd, "build.gradle"))) {
      return { type: "backend", language: "java", signals: ["java build file"] };
    }
    return null;
  }

  defaultCommands(detected: DetectedProject): WorkflowCommands {
    switch (detected.language) {
      case "python":
        return { test: "python -m pytest", lint: "python -m ruff check .", fmt: "python -m ruff format ." };
      case "go":
        return { test: "go test ./...", lint: "golangci-lint run", fmt: "gofmt -w .", build: "go build ./..." };
      case "rust":
        return { test: "cargo test", lint: "cargo clippy", fmt: "cargo fmt", build: "cargo build" };
      case "java":
        return { test: "mvn test", build: "mvn package", lint: "mvn checkstyle:check" };
      default:
        return { test: "echo 'no test command configured'", lint: "echo 'no lint command configured'" };
    }
  }

  defaultVerificationChecks(): string[] {
    return ["lint", "test"];
  }

  defaultCustomRules(): string[] {
    return [
      "Validate all input at the boundary layer",
      "Use structured logging",
      "Write integration tests for critical paths",
    ];
  }
}
