import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { parseSkillFile } from "../skill-extraction/parser.js";
import { validateConfig } from "../config/schema.js";
import {
  discoverHarnessSkillIds,
  getDistributedSkillPath,
  getExpectedToolHarnessFiles,
  isMetaSkill,
} from "../harness-inventory/index.js";
import { daysSinceLastVerify, getStaleVerifyDays, readLastVerifyState } from "./verify.js";

export interface DoctorOptions {
  json?: boolean;
  /** Run `harn verify` after schema-valid config checks. */
  verify?: boolean;
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

    const skills = discoverHarnessSkillIds(cwd);
    results.push({
      name: "skills",
      status: skills.length > 0 ? "pass" : "warn",
      message: `${skills.length} skill(s) found in .harness/skills/`,
    });

    if (tools && Array.isArray(tools) && skills.length > 0) {
      results.push(...checkSkillDistribution(cwd, tools, skills));
      results.push(...checkManualSkillDistribution(cwd, tools, skills));
    }

    results.push(...checkSkillVersioning(cwd, skills));

    results.push(...checkLastVerifyState(cwd));
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

  if (opts.verify && !opts.json && summary.fail === 0 && rawConfig) {
    const validation = validateConfig(rawConfig);
    if (validation.valid) {
      console.log("\n--- Verification (doctor --verify) ---\n");
      const { runVerify } = await import("./verify.js");
      const ok = runVerify({ cwd, quiet: false });
      if (!ok) process.exitCode = 1;
    }
  }
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
    console.log(`  Run 'harn doctor' for a full health check.`);
  }

  return summary;
}

function checkFile(cwd: string, rel: string, label: string): CheckResult {
  return existsSync(resolve(cwd, rel))
    ? { name: rel, status: "pass", message: `${label} exists` }
    : { name: rel, status: "fail", message: `${label} not found` };
}

function checkToolFiles(cwd: string, tool: string): CheckResult {
  const expected = getExpectedToolHarnessFiles(tool);
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

function checkManualSkillDistribution(
  cwd: string,
  tools: string[],
  skills: string[],
): CheckResult[] {
  const skillsDir = resolve(cwd, ".harness/skills");
  const results: CheckResult[] = [];

  for (const skill of skills) {
    if (isMetaSkill(skill)) continue;
    const skillPath = resolve(skillsDir, skill, "SKILL.md");
    if (!existsSync(skillPath)) continue;

    let parsed;
    try {
      parsed = parseSkillFile(readFileSync(skillPath, "utf-8"));
    } catch {
      continue;
    }
    if (parsed.source !== "manual") continue;

    const missingTools: string[] = [];
    for (const tool of tools) {
      const p = getDistributedSkillPath(tool, skill);
      if (!p || !existsSync(resolve(cwd, p))) {
        missingTools.push(tool);
      }
    }

    if (missingTools.length > 0) {
      results.push({
        name: `skill-source-${skill}`,
        status: "warn",
        message: `Manual skill "${skill}" missing in tool path(s): ${missingTools.join(", ")}`,
      });
    }
  }

  return results;
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

function checkLastVerifyState(cwd: string): CheckResult[] {
  const state = readLastVerifyState(cwd);
  if (!state) {
    return [
      {
        name: "last-verify",
        status: "warn",
        message: "No `.harness/state/last-verify.json` yet (run `harn verify`)",
      },
    ];
  }

  const results: CheckResult[] = [];
  if (!state.ok) {
    results.push({
      name: "last-verify",
      status: "warn",
      message: `Last verify failed (${state.failedChecks.join(", ") || "unknown"}) at ${state.timestamp}`,
    });
  } else {
    results.push({
      name: "last-verify",
      status: "pass",
      message: `Last verify passed at ${state.timestamp} (harness ${state.harnessVersion})`,
    });
  }

  const days = daysSinceLastVerify(cwd);
  const maxDays = getStaleVerifyDays();
  if (days !== null && days > maxDays) {
    results.push({
      name: "last-verify-stale",
      status: "warn",
      message: `Last verify is ${Math.floor(days)} day(s) old (>${maxDays}); run \`harn verify\` for a fresh check`,
    });
  }

  return results;
}

function checkSkillDistribution(cwd: string, tools: string[], skills: string[]): CheckResult[] {
  const distributableSkills = skills.filter((s) => !isMetaSkill(s));
  if (distributableSkills.length === 0) return [];

  const results: CheckResult[] = [];

  for (const tool of tools) {
    const testPath = getDistributedSkillPath(tool, "test");
    if (!testPath) {
      results.push({
        name: `skill-dist-${tool}`,
        status: "warn",
        message: `${tool}: unknown tool, cannot check skill distribution`,
      });
      continue;
    }

    const missing = distributableSkills.filter((s) => {
      const p = getDistributedSkillPath(tool, s);
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
