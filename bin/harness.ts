import { Command } from "commander";

const program = new Command();

program
  .name("agent-harness")
  .description(
    "Universal development pipeline harness — config, templates, skills, and health checks for AI-assisted projects.",
  )
  .version("0.1.0");

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
  .action(async () => {
    const { runDoctor } = await import("../src/cli/doctor.js");
    await runDoctor();
  });

program
  .command("list <resource>")
  .description("List available resources (skills|agents|commands|templates)")
  .action(async (resource: string) => {
    const { runList } = await import("../src/cli/list.js");
    await runList(resource);
  });

program.parse();
