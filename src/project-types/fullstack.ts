import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ProjectTypeAdapter, DetectedProject, WorkflowCommands } from "./types.js";

export class FullstackAdapter implements ProjectTypeAdapter {
  id = "fullstack" as const;
  label = "Fullstack";

  detect(cwd: string): DetectedProject | null {
    const hasPkg = existsSync(join(cwd, "package.json"));
    const hasPython = existsSync(join(cwd, "pyproject.toml")) || existsSync(join(cwd, "requirements.txt"));
    const hasGo = existsSync(join(cwd, "go.mod"));

    if (hasPkg && (hasPython || hasGo)) {
      const backendLang = hasPython ? "python" : "go";
      return { type: "fullstack", language: `typescript+${backendLang}`, signals: ["package.json + backend markers"] };
    }

    if (hasPkg) {
      try {
        const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf-8"));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        const hasExpress = deps["express"] || deps["fastify"] || deps["hono"] || deps["koa"];
        const hasFrontend = deps["react"] || deps["vue"] || deps["next"] || deps["nuxt"] || deps["svelte"];
        if (hasExpress && hasFrontend) {
          return { type: "fullstack", language: "typescript", signals: ["frontend + backend deps in package.json"] };
        }
      } catch { /* ignore parse errors */ }
    }

    return null;
  }

  defaultCommands(): WorkflowCommands {
    return {
      dev: "npm run dev",
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
      "Keep frontend and backend in clearly separated directories",
      "Share types or schemas between layers when possible",
      "Use API contracts to decouple frontend and backend",
    ];
  }
}
