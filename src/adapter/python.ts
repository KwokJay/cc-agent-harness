import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ProjectAdapter, CommandDefinition, HealthCheck } from "./interface.js";

export class PythonAdapter implements ProjectAdapter {
  name = "python";

  async detect(cwd: string): Promise<boolean> {
    return (
      existsSync(join(cwd, "pyproject.toml")) ||
      existsSync(join(cwd, "setup.py")) ||
      existsSync(join(cwd, "requirements.txt"))
    );
  }

  getCommands(): CommandDefinition[] {
    return [
      { name: "test", command: "pytest", description: "Run Python tests" },
      { name: "lint", command: "ruff check .", description: "Run linter" },
      { name: "fmt", command: "ruff format .", description: "Format Python code" },
    ];
  }

  getHealthChecks(): HealthCheck[] {
    return [
      {
        name: "python-installed",
        check: async () => {
          try {
            const { execSync } = await import("node:child_process");
            const out = execSync("python3 --version", { stdio: "pipe" }).toString().trim();
            return { status: "pass", message: out };
          } catch {
            return { status: "fail", message: "python3 not found in PATH" };
          }
        },
      },
    ];
  }
}
