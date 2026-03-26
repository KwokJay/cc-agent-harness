import { Command } from "commander";

const program = new Command();

program
  .name("agent-harness")
  .description(
    "Harness scaffold tool — initialize AI-assisted development environments for any project type and AI coding tool.",
  )
  .version("0.4.0");

program
  .command("init")
  .description("Initialize harness for the current project")
  .option("-p, --project <type>", "Project type (frontend|backend|fullstack|monorepo|docs)")
  .option("-t, --tools <tools>", "AI tools, comma-separated (cursor,claude-code,copilot,codex,opencode)")
  .option("-n, --name <name>", "Project name (defaults to directory name)")
  .option("--toolpacks <packs>", "Optional toolpacks, comma-separated (context-mode,rtk,understand-anything,gstack)")
  .option("--skip-docs", "Skip generating docs/ directory structure")
  .option("--overwrite", "Overwrite existing files")
  .action(async (opts) => {
    const { runInit } = await import("../src/cli/init.js");
    await runInit(opts);
  });

program
  .command("doctor")
  .description("Check health of the harness setup")
  .option("--json", "Output machine-readable JSON")
  .option("--verify", "After checks, run configured verification commands (workflows.verification.checks)")
  .action(async (opts) => {
    const { runDoctor } = await import("../src/cli/doctor.js");
    await runDoctor(opts);
  });

program
  .command("verify")
  .description("Run project verification commands from .harness/config.yaml")
  .action(async () => {
    const { runVerifyCli } = await import("../src/cli/verify.js");
    await runVerifyCli();
  });

program
  .command("update")
  .description("Refresh generated harness files from current config")
  .option("--overwrite", "Force overwrite all files")
  .option("--dry-run", "Preview changes without writing files")
  .option("--full", "Force full regeneration (default: incremental)")
  .action(async (opts) => {
    const { runUpdate } = await import("../src/cli/update.js");
    await runUpdate(opts);
  });

program
  .command("list <resource>")
  .description("List supported resources (tools|projects|toolpacks)")
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
      case "toolpacks": {
        const { getOptionalToolpacks } = await import("../src/toolpacks/registry.js");
        console.log("Optional toolpacks:\n");
        const categoryLabels: Record<string, string> = {
          "context-engineering": "Context Engineering",
          analysis: "Analysis",
          "engineering-support": "Engineering Support",
          "init-enhancement": "Initialization Enhancement",
        };
        const packs = getOptionalToolpacks(process.cwd());
        let lastCategory = "";
        for (const pack of packs) {
          if (pack.category !== lastCategory) {
            if (lastCategory) console.log("");
            console.log(`  [${categoryLabels[pack.category] ?? pack.category}]`);
            lastCategory = pack.category;
          }
          const meta = `source=${pack.packSource} version=${pack.packVersion}`;
          console.log(`    ${pack.id.padEnd(20)} ${meta.padEnd(36)} ${pack.description}`);
        }
        break;
      }
      default:
        console.error(`Unknown resource: ${resource}`);
        console.error("Available: tools, projects, toolpacks");
        process.exitCode = 1;
    }
  });

program.parse();
