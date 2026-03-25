import { execSync } from "node:child_process";
import { loadConfig, configExists } from "../config/loader.js";
import { detectProjectType } from "../adapter/detector.js";

export async function runTask(taskName: string): Promise<void> {
  const cwd = process.cwd();

  if (!configExists(cwd)) {
    console.log("No harness configuration found. Run `agent-harness setup` first.");
    process.exitCode = 1;
    return;
  }

  const config = await loadConfig({ cwd });
  const commandMap = await resolveAllCommands(cwd, config);

  const command = commandMap.get(taskName);
  if (!command) {
    console.error(`Unknown task: "${taskName}"`);
    console.error("\nAvailable tasks:");
    for (const [name, cmd] of commandMap) {
      console.error(`  ${name}: ${cmd}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Running "${taskName}": ${command}\n`);

  try {
    execSync(command, { cwd, stdio: "inherit", timeout: 300_000 });
  } catch {
    process.exitCode = 1;
  }
}

async function resolveAllCommands(
  cwd: string,
  config: Awaited<ReturnType<typeof loadConfig>>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  const adapter = await detectProjectType(cwd);
  if (adapter) {
    for (const cmd of adapter.getCommands()) {
      map.set(cmd.name, cmd.command);
    }
  }

  for (const [name, cmd] of Object.entries(config.workflows.commands)) {
    map.set(name, cmd);
  }

  return map;
}
