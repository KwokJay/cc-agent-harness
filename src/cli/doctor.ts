import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { parseSkillFile } from "../skill-extraction/parser.js";
import { validateConfig } from "../config/schema.js";

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

  const rawConfig = loadHarnessConfig(cwd);
  if (rawConfig) {
    const validation = validateConfig(rawConfig);
    if (validation.valid) {
      results.push({ name: "config-valid", status: "pass", message: "Harness config is valid" });
    } else {
      results.push({ name: "config-valid", status: "warn", message: `Config has issues: ${validation.errors.join("; ")}` });
    }

    const tools = rawConfig.tools as string[] | undefined;
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

    if (tools && Array.isArray(tools) && skills.length > 0) {
      results.push(...checkSkillDistribution(cwd, tools, skills));
    }

    results.push(...checkSkillVersioning(cwd, skills));
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

export async function runLightDoctor(): Promise<{ pass: number; warn: number; fail: number }> {
  const cwd = process.cwd();
  const results: CheckResult[] = [];

  results.push(checkFile(cwd, ".harness/config.yaml", "Harness config"));
  results.push(checkFile(cwd, "AGENTS.md", "AGENTS.md"));

  const rawConfig = loadHarnessConfig(cwd);
  if (rawConfig) {
    const validation = validateConfig(rawConfig);
    results.push(
      validation.valid
        ? { name: "config-valid", status: "pass", message: "Config valid" }
        : { name: "config-valid", status: "warn", message: `Config issues: ${validation.errors.join("; ")}` },
    );
  }

  const summary = {
    pass: results.filter((r) => r.status === "pass").length,
    warn: results.filter((r) => r.status === "warn").length,
    fail: results.filter((r) => r.status === "fail").length,
  };

  if (summary.fail > 0 || summary.warn > 0) {
    console.log("\n  Quick check:");
    const icon = { pass: "[PASS]", warn: "[WARN]", fail: "[FAIL]" };
    for (const r of results) {
      if (r.status !== "pass") {
        console.log(`    ${icon[r.status]} ${r.message}`);
      }
    }
    console.log(`  Run 'agent-harness doctor' for a full health check.`);
  }

  return summary;
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
    windsurf: [".windsurf/rules/project.md"],
    trae: [".trae/rules/project.md"],
    augment: ["augment-guidelines.md"],
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

const META_SKILLS = new Set(["skill-creator", "project-skill-extractor", "changelog-governance", "docs-governance"]);

function getSkillPath(tool: string, skillName: string): string {
  const pathMap: Record<string, (name: string) => string> = {
    cursor: (n) => `.cursor/rules/skill-${n}.mdc`,
    "claude-code": (n) => `.claude/skills/${n}/SKILL.md`,
    copilot: (n) => `.github/instructions/${n}.instructions.md`,
    codex: (n) => `.agents/skills/${n}/SKILL.md`,
    opencode: (n) => `.opencode/skills/${n}/SKILL.md`,
    windsurf: (n) => `.windsurf/rules/skill-${n}.md`,
    trae: (n) => `.trae/rules/skill-${n}.md`,
    augment: (n) => `.augment/skills/${n}/SKILL.md`,
  };
  return pathMap[tool]?.(skillName) ?? "";
}

function checkSkillVersioning(cwd: string, skills: string[]): CheckResult[] {
  const skillsDir = resolve(cwd, ".harness/skills");
  const results: CheckResult[] = [];
  let withVersion = 0;
  let withoutVersion = 0;

  for (const skill of skills) {
    const skillPath = resolve(skillsDir, skill, "SKILL.md");
    if (!existsSync(skillPath)) continue;

    try {
      const content = readFileSync(skillPath, "utf-8");
      const parsed = parseSkillFile(content);
      if (parsed.version > 0) {
        withVersion++;
      } else {
        withoutVersion++;
      }
    } catch {
      withoutVersion++;
    }
  }

  if (withoutVersion > 0) {
    results.push({
      name: "skill-version",
      status: "warn",
      message: `${withoutVersion} skill(s) missing version metadata (run update to add)`,
    });
  } else if (withVersion > 0) {
    results.push({
      name: "skill-version",
      status: "pass",
      message: `All ${withVersion} skill(s) have version metadata`,
    });
  }

  return results;
}

function checkSkillDistribution(cwd: string, tools: string[], skills: string[]): CheckResult[] {
  const distributableSkills = skills.filter((s) => !META_SKILLS.has(s));
  if (distributableSkills.length === 0) return [];

  const results: CheckResult[] = [];

  for (const tool of tools) {
    const testPath = getSkillPath(tool, "test");
    if (!testPath) {
      results.push({
        name: `skill-dist-${tool}`,
        status: "warn",
        message: `${tool}: unknown tool, cannot check skill distribution`,
      });
      continue;
    }

    const missing = distributableSkills.filter((s) => {
      const p = getSkillPath(tool, s);
      return !existsSync(resolve(cwd, p));
    });

    if (missing.length === 0) {
      results.push({
        name: `skill-dist-${tool}`,
        status: "pass",
        message: `${tool}: all ${distributableSkills.length} skill(s) distributed`,
      });
    } else {
      results.push({
        name: `skill-dist-${tool}`,
        status: missing.length === distributableSkills.length ? "fail" : "warn",
        message: `${tool}: ${missing.length}/${distributableSkills.length} skill(s) not distributed (${missing.join(", ")})`,
      });
    }
  }

  return results;
}
