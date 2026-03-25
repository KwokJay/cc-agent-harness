import { discoverSkills } from "../skill/manager.js";
import { AgentRegistry } from "../agent/registry.js";
import { loadConfig, configExists } from "../config/loader.js";
import type { AgentDefinition } from "../config/schema.js";

export async function runList(resource: string): Promise<void> {
  const cwd = process.cwd();

  switch (resource) {
    case "skills":
      await listSkills(cwd);
      break;
    case "agents":
      await listAgents(cwd);
      break;
    case "commands":
      await listCommands(cwd);
      break;
    case "templates":
      listTemplates();
      break;
    default:
      console.error(`Unknown resource: ${resource}`);
      console.error("Available: skills, agents, commands, templates");
      process.exitCode = 1;
  }
}

async function listSkills(cwd: string): Promise<void> {
  let dirs = [".harness/skills"];
  if (configExists(cwd)) {
    const config = await loadConfig({ cwd });
    dirs = config.skills.directories;
  }
  const skills = await discoverSkills(dirs, cwd);

  if (skills.length === 0) {
    console.log("No skills found.");
    return;
  }

  console.log(`Skills (${skills.length}):\n`);
  for (const skill of skills) {
    const status = skill.valid ? "✓" : "✗";
    console.log(`  ${status} ${skill.name}`);
    if (skill.description) {
      console.log(`    ${skill.description.slice(0, 80)}${skill.description.length > 80 ? "..." : ""}`);
    }
  }
}

async function listAgents(cwd: string): Promise<void> {
  let customDefs: AgentDefinition[] = [];
  if (configExists(cwd)) {
    const config = await loadConfig({ cwd });
    customDefs = config.agents.definitions;
  }

  const registry = new AgentRegistry(customDefs);
  const counts = registry.count();
  const domains = registry.domains();

  console.log(`Agents (${counts.total} total: ${counts.builtin} built-in, ${counts.custom} custom):\n`);

  for (const domain of domains.sort()) {
    const agents = registry.listByDomain(domain);
    console.log(`  [${domain}]`);
    for (const a of agents) {
      console.log(`    ${a.name} (${a.tier})`);
    }
  }
}

async function listCommands(cwd: string): Promise<void> {
  if (!configExists(cwd)) {
    console.log("No harness configuration found. Run `agent-harness setup` first.");
    return;
  }

  const config = await loadConfig({ cwd });
  const commands = config.workflows.commands;
  const entries = Object.entries(commands);

  if (entries.length === 0) {
    console.log("No custom commands registered.");
    return;
  }

  console.log(`Commands (${entries.length}):\n`);
  for (const [name, cmd] of entries) {
    console.log(`  ${name}: ${cmd}`);
  }
}

function listTemplates(): void {
  console.log("Available AGENTS.md templates:\n");
  console.log("  minimal   — Minimal AGENTS.md with basic structure");
  console.log("  standard  — Standard version with common rules");
  console.log("  full      — Complete version with orchestration rules");
  console.log("\nAvailable skill templates:\n");
  console.log("  basic     — Basic skill (SKILL.md + metadata.yaml)");
}
