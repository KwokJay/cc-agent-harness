import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ProjectAdapter, CommandDefinition, HealthCheck } from "./interface.js";

export class RustAdapter implements ProjectAdapter {
  name = "rust";

  async detect(cwd: string): Promise<boolean> {
    return existsSync(join(cwd, "Cargo.toml"));
  }

  getCommands(): CommandDefinition[] {
    return [
      { name: "fmt", command: "cargo fmt", description: "Format Rust code" },
      { name: "test", command: "cargo test", description: "Run Rust tests" },
      { name: "clippy", command: "cargo clippy --tests", description: "Run Clippy lints" },
      { name: "build", command: "cargo build", description: "Build project" },
    ];
  }

  getHealthChecks(): HealthCheck[] {
    return [
      {
        name: "cargo-installed",
        check: async () => {
          try {
            const { execSync } = await import("node:child_process");
            execSync("cargo --version", { stdio: "pipe" });
            return { status: "pass", message: "cargo is available" };
          } catch {
            return { status: "fail", message: "cargo not found in PATH" };
          }
        },
      },
    ];
  }
}
