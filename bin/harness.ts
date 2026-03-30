import { Command } from "commander";
import { getHarnessVersion } from "../src/cli/harness-version.js";

const program = new Command();

program
  .name("harn")
  .description(
    "Repo-local AI development harness — scaffold rules, skills, and governance artifacts across Cursor, Claude Code, Codex, and more; verify and export for audits.",
  )
  .version(getHarnessVersion());

program
  .command("init")
  .description("Initialize harness for the current project")
  .option("-p, --project <type>", "Project type (frontend|backend|fullstack|monorepo|docs)")
  .option(
    "-t, --tools <tools>",
    "AI tool ids, comma-separated (run `harn list tools` for the full list)",
  )
  .option("-n, --name <name>", "Project name (defaults to directory name)")
  .option("--toolpacks <packs>", "Optional toolpacks, comma-separated (context-mode,rtk,understand-anything,gstack)")
  .option("--skip-docs", "Skip generating docs/ directory structure")
  .option("--skip-skill-extraction", "Skip Step 2 AI skill extraction (e.g. CI smoke tests)")
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
  .command("diagnose")
  .description("Deep harness diagnostics (config, skills, verification wiring, MCP JSON, writable dirs)")
  .option("--json", "Output machine-readable JSON report")
  .option("--run-verify", "After checks, run configured verification commands")
  .action(async (opts: { json?: boolean; runVerify?: boolean }) => {
    const { runDiagnose } = await import("../src/cli/diagnose.js");
    await runDiagnose({ json: opts.json, runVerify: opts.runVerify });
  });

program
  .command("verify")
  .description("Run project verification commands from .harness/config.yaml")
  .action(async () => {
    const { runVerifyCli } = await import("../src/cli/verify.js");
    await runVerifyCli();
  });

program
  .command("manifest")
  .description("Regenerate .harness/manifest.json from config and workspace scan")
  .option("--json", "Print manifest JSON to stdout after writing")
  .action(async (cmdOpts: { json?: boolean }) => {
    const { runManifest } = await import("../src/cli/manifest.js");
    await runManifest(cmdOpts);
  });

program
  .command("migrate <fromVersion>")
  .description("Show or apply registered migrations from a prior harness CLI version")
  .option("--apply", "Execute registered patches (default: dry-run)")
  .action(async (fromVersion: string, cmdOpts: { apply?: boolean }) => {
    const { runMigrate } = await import("../src/cli/migrate.js");
    await runMigrate({ fromVersion, apply: cmdOpts.apply });
  });

program
  .command("export")
  .description("Export harness summary (same data as manifest) to stdout or a file")
  .option("-f, --format <format>", "json or md", "md")
  .option("-o, --out <file>", "Write to file instead of stdout")
  .action(async (cmdOpts: { format?: string; out?: string }) => {
    const { runExport } = await import("../src/cli/export.js");
    const f = cmdOpts.format === "json" ? "json" : "md";
    await runExport({ format: f, out: cmdOpts.out });
  });

const mcp = program.command("mcp").description("MCP config helpers (Cursor)");

mcp
  .command("merge [name]")
  .description(
    "Merge one server into .cursor/mcp.json (stdin or --file JSON; body is server config, or one-key object)",
  )
  .option("-f, --file <path>", "Read server JSON from file instead of stdin")
  .option("--dry-run", "Print resulting mcp.json to stdout; do not write")
  .action(async (name: string | undefined, cmdOpts: { file?: string; dryRun?: boolean }) => {
    const { runMcpMergeCli } = await import("../src/cli/mcp.js");
    runMcpMergeCli({
      cwd: process.cwd(),
      name: name ?? "",
      file: cmdOpts.file,
      dryRun: cmdOpts.dryRun,
    });
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
