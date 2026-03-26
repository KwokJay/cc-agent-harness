import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ProjectTypeAdapter, DetectedProject, WorkflowCommands } from "./types.js";

export class MonorepoAdapter implements ProjectTypeAdapter {
  id = "monorepo" as const;
  label = "Monorepo";

  detect(cwd: string): DetectedProject | null {
    if (existsSync(join(cwd, "pnpm-workspace.yaml"))) {
      return { type: "monorepo", language: "typescript", framework: "pnpm", signals: ["pnpm-workspace.yaml"] };
    }

    const cargoPath = join(cwd, "Cargo.toml");
    if (existsSync(cargoPath)) {
      try {
        const content = readFileSync(cargoPath, "utf-8");
        if (content.includes("[workspace]")) {
          return { type: "monorepo", language: "rust", framework: "cargo", signals: ["Cargo.toml workspace"] };
        }
      } catch { /* ignore */ }
    }

    if (existsSync(join(cwd, "lerna.json"))) {
      return { type: "monorepo", language: "typescript", framework: "lerna", signals: ["lerna.json"] };
    }

    const pkgPath = join(cwd, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        if (pkg.workspaces) {
          return { type: "monorepo", language: "typescript", framework: "npm-workspaces", signals: ["package.json workspaces"] };
        }
      } catch { /* ignore */ }
    }

    return null;
  }

  defaultCommands(): WorkflowCommands {
    return {
      build: "npm run build",
      test: "npm test",
      lint: "npm run lint",
    };
  }

  defaultVerificationChecks(): string[] {
    return ["lint", "build", "test"];
  }

  defaultCustomRules(): string[] {
    return [
      "Respect package boundaries; do not import across packages without explicit dependency",
      "Keep shared utilities in a dedicated package",
      "Run only affected tests and builds when possible",
    ];
  }
}
