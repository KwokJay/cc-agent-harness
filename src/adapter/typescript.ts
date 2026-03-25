import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ProjectAdapter, CommandDefinition, HealthCheck } from "./interface.js";

export class TypeScriptAdapter implements ProjectAdapter {
  name = "typescript";

  async detect(cwd: string): Promise<boolean> {
    return (
      existsSync(join(cwd, "tsconfig.json")) ||
      existsSync(join(cwd, "package.json"))
    );
  }

  getCommands(): CommandDefinition[] {
    return [
      { name: "build", command: "npm run build", description: "Build TypeScript project" },
      { name: "test", command: "npm test", description: "Run tests" },
      { name: "lint", command: "npm run lint", description: "Run linter" },
    ];
  }

  getHealthChecks(): HealthCheck[] {
    return [
      {
        name: "node-version",
        check: async () => {
          const major = parseInt(process.versions.node.split(".")[0], 10);
          if (major >= 22) {
            return { status: "pass", message: `Node.js v${process.versions.node}` };
          }
          return {
            status: "warn",
            message: `Node.js v${process.versions.node} (>=22 recommended)`,
          };
        },
      },
    ];
  }
}
