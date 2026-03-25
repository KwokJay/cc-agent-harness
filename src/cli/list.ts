import { discoverSkills } from "../skill/manager.js";
import { AgentRegistry } from "../agent/registry.js";
import { loadConfig, projectConfigExists } from "../config/loader.js";
import type { AgentDefinition } from "../config/schema.js";
import { HarnessRuntime } from "../runtime/harness.js";

export async function runList(resource: string): Promise<void> {
  switch (resource) {
    case "skills":
      await listSkills();
      break;
    case "agents":
      await listAgents();
      break;
    case "commands":
      await listCommands();
      break;
    case "templates":
      listTemplates();
      break;
    case "features":
      await listFeatures();
      break;
    default:
      console.error(`Unknown resource: ${resource}`);
      console.error("Available: skills, agents, commands, templates, features");
      process.exitCode = 1;
  }
}

async function listSkills(): Promise<void> {
  const cwd = process.cwd();
  let dirs = [".harness/skills"];
  if (projectConfigExists(cwd)) {
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

async function listAgents(): Promise<void> {
  const cwd = process.cwd();
  let customDefs: AgentDefinition[] = [];
  if (projectConfigExists(cwd)) {
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

async function listCommands(): Promise<void> {
  const runtime = await HarnessRuntime.create({ requireProjectConfig: true });
  const tasks = runtime.listTasks();

  if (tasks.length === 0) {
    console.log("No commands registered.");
    return;
  }

  console.log(`Commands (${tasks.length}):\n`);
  for (const task of tasks) {
    const suffix = task.adapterName ? ` via ${task.adapterName}` : "";
    console.log(`  ${task.name}: ${task.command} [${task.source}${suffix}]`);
  }
}

async function listFeatures(): Promise<void> {
  const runtime = await HarnessRuntime.create();

  if (!runtime.hasAnyConfig) {
    console.log("No harness configuration found. Run `agent-harness setup` first.");
    return;
  }

  const features = runtime.listFeatureStates();
  if (features.length === 0) {
    console.log("No feature flags registered.");
    return;
  }

  console.log(`Features (${features.length}):\n`);
  for (const feature of features) {
    const configured = feature.configured
      ? ` configured=${String(feature.configuredValue)}`
      : "";
    console.log(
      `  ${feature.spec.key}: ${feature.enabled ? "enabled" : "disabled"} (${feature.spec.stage})${configured}`,
    );
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
