import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ProjectTypeAdapter, DetectedProject, WorkflowCommands } from "./types.js";

export class DocsAdapter implements ProjectTypeAdapter {
  id = "docs" as const;
  label = "Documentation";

  detect(cwd: string): DetectedProject | null {
    if (existsSync(join(cwd, "mkdocs.yml"))) {
      return { type: "docs", language: "markdown", framework: "mkdocs", signals: ["mkdocs.yml"] };
    }
    if (existsSync(join(cwd, "docusaurus.config.js")) || existsSync(join(cwd, "docusaurus.config.ts"))) {
      return { type: "docs", language: "markdown", framework: "docusaurus", signals: ["docusaurus.config"] };
    }
    if (existsSync(join(cwd, "book.toml"))) {
      return { type: "docs", language: "markdown", framework: "mdbook", signals: ["book.toml"] };
    }
    return null;
  }

  defaultCommands(detected: DetectedProject): WorkflowCommands {
    switch (detected.framework) {
      case "mkdocs":
        return { build: "mkdocs build", preview: "mkdocs serve" };
      case "docusaurus":
        return { build: "npm run build", preview: "npm run start" };
      case "mdbook":
        return { build: "mdbook build", preview: "mdbook serve" };
      default:
        return { build: "echo 'no build configured'" };
    }
  }

  defaultVerificationChecks(): string[] {
    return ["build"];
  }

  defaultCustomRules(): string[] {
    return [
      "Write in clear, concise language",
      "Use headings to create scannable structure",
      "Include code examples for technical concepts",
    ];
  }
}
