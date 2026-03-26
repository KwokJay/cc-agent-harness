import { Command } from "commander";

const program = new Command();

program
  .name("agent-harness")
  .description(
    "Harness scaffold tool — initialize AI-assisted development environments for any project type and AI coding tool.",
  )
  .version("0.1.0");

program
  .command("init")
  .description("Initialize harness for the current project")
  .option("-p, --project <type>", "Project type (frontend|backend|fullstack|monorepo|docs)")
  .option("-t, --tools <tools>", "AI tools, comma-separated (cursor,claude-code,copilot,codex,opencode)", "cursor,claude-code")
  .option("-n, --name <name>", "Project name (defaults to directory name)")
  .option("--overwrite", "Overwrite existing files")
  .action(async (opts) => {
    const { runInit } = await import("../src/cli/init.js");
    await runInit(opts);
  });

program
  .command("doctor")
  .description("Check health of the harness setup")
  .option("--json", "Output machine-readable JSON")
  .action(async (opts) => {
    const { runDoctor } = await import("../src/cli/doctor.js");
    await runDoctor(opts);
  });

program
  .command("update")
  .description("Refresh generated harness files from current config")
  .option("--overwrite", "Force overwrite all files")
  .action(async (opts) => {
    const { runUpdate } = await import("../src/cli/update.js");
    await runUpdate(opts);
  });

program
  .command("list <resource>")
  .description("List supported resources (tools|projects)")
  .action(async (resource: string) => {
    switch (resource) {
      case "tools": {
        const { listToolAdapters } = await import("../src/tool-adapters/index.js");
        console.log("Supported AI tools:\n");
        for (const adapter of listToolAdapters()) {
          console.log(`  ${adapter.id.padEnd(14)} ${adapter.label}`);
        }
        break;
      }
      case "projects": {
        const { ALL_PROJECT_TYPE_IDS } = await import("../src/project-types/index.js");
        console.log("Supported project types:\n");
        for (const id of ALL_PROJECT_TYPE_IDS) {
          console.log(`  ${id}`);
        }
        break;
      }
      default:
        console.error(`Unknown resource: ${resource}`);
        console.error("Available: tools, projects");
        process.exitCode = 1;
    }
  });

program.parse();
