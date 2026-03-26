import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ProjectTypeAdapter, DetectedProject, WorkflowCommands } from "./types.js";

export class FrontendAdapter implements ProjectTypeAdapter {
  id = "frontend" as const;
  label = "Frontend";

  detect(cwd: string): DetectedProject | null {
    const pkgPath = join(cwd, "package.json");
    if (!existsSync(pkgPath)) return null;

    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const framework = detectFramework(deps);
      if (!framework) return null;

      return { type: "frontend", language: "typescript", framework, signals: [`package.json with ${framework}`] };
    } catch {
      return null;
    }
  }

  defaultCommands(detected: DetectedProject): WorkflowCommands {
    const cmds: WorkflowCommands = {
      dev: "npm run dev",
      build: "npm run build",
      test: "npm test",
      lint: "npm run lint",
    };
    if (detected.framework === "next") {
      cmds.dev = "npx next dev";
      cmds.build = "npx next build";
    }
    return cmds;
  }

  defaultVerificationChecks(): string[] {
    return ["lint", "build", "test"];
  }

  defaultCustomRules(): string[] {
    return [
      "Use functional components with hooks",
      "Keep components small and focused",
      "Ensure keyboard accessibility for interactive elements",
    ];
  }
}

function detectFramework(deps: Record<string, string>): string | null {
  if (deps["next"]) return "next";
  if (deps["nuxt"]) return "nuxt";
  if (deps["@sveltejs/kit"] || deps["svelte"]) return "svelte";
  if (deps["vue"]) return "vue";
  if (deps["react"]) return "react";
  if (deps["@angular/core"]) return "angular";
  return null;
}
