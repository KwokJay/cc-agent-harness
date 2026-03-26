import { Command } from "commander";

const program = new Command();

program
  .name("agent-harness")
  .description(
    "Universal development pipeline harness — config, templates, skills, and health checks for AI-assisted projects.",
  )
  .version("0.0.1");

program
  .command("setup")
  .description("Initialize harness in the current project")
  .option("-l, --language <lang>", "Project language (rust|typescript|python|multi)")
  .option("-t, --template <variant>", "AGENTS.md template variant (minimal|standard|full)", "standard")
  .action(async (opts) => {
    const { runSetup } = await import("../src/cli/setup.js");
    await runSetup(opts);
  });

program
  .command("update")
  .description("Sync/upgrade templates and configuration")
  .option("--check", "Dry-run: show what would change without modifying files")
  .option("--template <name>", "Only update a specific template (e.g. agents-md)")
  .action(async (opts) => {
    const { runUpdate } = await import("../src/cli/update.js");
    await runUpdate(opts);
  });

program
  .command("doctor")
  .description("Run health checks on the current project")
  .option("--json", "Output machine-readable JSON")
  .action(async (opts) => {
    const { runDoctor } = await import("../src/cli/doctor.js");
    await runDoctor(opts);
  });

program
  .command("verify")
  .description("Run verification checks (build, test, lint)")
  .option("--fail-fast", "Stop on first failure")
  .option("--json", "Output machine-readable JSON")
  .action(async (opts) => {
    const { runVerify } = await import("../src/cli/verify.js");
    await runVerify(opts);
  });

program
  .command("list <resource>")
  .description("List available resources (skills|agents|commands|templates|features)")
  .action(async (resource: string) => {
    const { runList } = await import("../src/cli/list.js");
    await runList(resource);
  });

const configCmd = program
  .command("config")
  .description("Configuration management");

configCmd
  .command("show")
  .description("Display merged configuration")
  .action(async () => {
    const { runConfigShow } = await import("../src/cli/config.js");
    await runConfigShow();
  });

configCmd
  .command("validate")
  .description("Validate configuration files")
  .action(async () => {
    const { runConfigValidate } = await import("../src/cli/config.js");
    await runConfigValidate();
  });

program
  .command("run <task>")
  .description("Execute a named task from workflows.commands or adapter")
  .action(async (task: string) => {
    const { runTask } = await import("../src/cli/run.js");
    await runTask(task);
  });

const schemaCmd = program
  .command("schema")
  .description("Schema management");

schemaCmd
  .command("generate")
  .description("Generate JSON Schema from config definition")
  .option("-o, --output <path>", "Output file path", ".harness/schema.json")
  .action(async (opts) => {
    const { runSchemaGenerate } = await import("../src/cli/schema.js");
    await runSchemaGenerate(opts);
  });

const contextCmd = program
  .command("context")
  .description("Context assembly and export");

contextCmd
  .command("build")
  .description("Build assembled agent context")
  .option("-f, --format <style>", "Tag style (markdown|xml|none)", "markdown")
  .option("-o, --output <path>", "Write context to a file instead of stdout")
  .option("--no-include-skills", "Skip skills summary")
  .option("--no-include-rules", "Skip custom rules")
  .action(async (opts) => {
    const { runContextBuild } = await import("../src/cli/context.js");
    await runContextBuild(opts);
  });

program
  .command("scaffold")
  .description("Scaffold a new skill")
  .argument("<type>", "Resource type to scaffold (skill)")
  .argument("<name>", "Name of the resource")
  .option("-d, --description <desc>", "Description of the resource")
  .action(async (type: string, name: string, opts) => {
    if (type !== "skill") {
      console.error(`Unknown scaffold type: ${type}. Available: skill`);
      process.exitCode = 1;
      return;
    }
    const { runScaffoldSkill } = await import("../src/cli/scaffold.js");
    await runScaffoldSkill(name, opts);
  });

program.parse();
