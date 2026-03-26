import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";

export interface DoctorOptions {
  json?: boolean;
}

interface CheckResult {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

export async function runDoctor(opts: DoctorOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const results: CheckResult[] = [];

  results.push(checkFile(cwd, ".harness/config.yaml", "Harness config"));
  results.push(checkFile(cwd, "AGENTS.md", "AGENTS.md"));

  const config = loadHarnessConfig(cwd);
  if (config) {
    results.push({ name: "config-valid", status: "pass", message: "Harness config is valid YAML" });

    const tools = config.tools as string[] | undefined;
    if (tools && Array.isArray(tools)) {
      for (const tool of tools) {
        results.push(checkToolFiles(cwd, tool));
      }
    }

    const skills = findSkills(cwd);
    results.push({
      name: "skills",
      status: skills.length > 0 ? "pass" : "warn",
      message: `${skills.length} skill(s) found in .harness/skills/`,
    });
  } else if (existsSync(resolve(cwd, ".harness/config.yaml"))) {
    results.push({ name: "config-valid", status: "fail", message: "Harness config exists but is not valid YAML" });
  }

  const summary = {
    pass: results.filter((r) => r.status === "pass").length,
    warn: results.filter((r) => r.status === "warn").length,
    fail: results.filter((r) => r.status === "fail").length,
  };

  if (opts.json) {
    console.log(JSON.stringify({ results, summary }, null, 2));
  } else {
    console.log("Agent Harness Doctor");
    console.log("====================\n");
    const icon = { pass: "[PASS]", warn: "[WARN]", fail: "[FAIL]" };
    for (const r of results) {
      console.log(`  ${icon[r.status]} ${r.message}`);
    }
    console.log(`\nSummary: ${summary.pass} passed, ${summary.warn} warning(s), ${summary.fail} failure(s)`);
  }

  if (summary.fail > 0) process.exitCode = 1;
}

function checkFile(cwd: string, rel: string, label: string): CheckResult {
  return existsSync(resolve(cwd, rel))
    ? { name: rel, status: "pass", message: `${label} exists` }
    : { name: rel, status: "fail", message: `${label} not found` };
}

function checkToolFiles(cwd: string, tool: string): CheckResult {
  const fileMap: Record<string, string[]> = {
    cursor: [".cursor/rules/project.mdc"],
    "claude-code": ["CLAUDE.md"],
    copilot: [".github/copilot-instructions.md"],
    codex: [".codex/config.toml"],
    opencode: ["opencode.json"],
  };

  const expected = fileMap[tool];
  if (!expected) return { name: `tool-${tool}`, status: "warn", message: `Unknown tool: ${tool}` };

  const missing = expected.filter((f) => !existsSync(resolve(cwd, f)));
  if (missing.length === 0) {
    return { name: `tool-${tool}`, status: "pass", message: `${tool}: all files present` };
  }
  return { name: `tool-${tool}`, status: "fail", message: `${tool}: missing ${missing.join(", ")}` };
}

function loadHarnessConfig(cwd: string): Record<string, unknown> | null {
  const configPath = resolve(cwd, ".harness/config.yaml");
  if (!existsSync(configPath)) return null;
  try {
    return parseYaml(readFileSync(configPath, "utf-8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function findSkills(cwd: string): string[] {
  const skillsDir = resolve(cwd, ".harness/skills");
  if (!existsSync(skillsDir)) return [];
  try {
    return readdirSync(skillsDir).filter((entry) => {
      return existsSync(resolve(skillsDir, entry, "SKILL.md"));
    });
  } catch {
    return [];
  }
}
