import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { resolve as resolveScaffold } from "../scaffold/resolver.js";
import { generateFiles } from "../scaffold/generator.js";
import { diffPlan } from "../scaffold/differ.js";
import { refreshHarnessManifest } from "../manifest/refresh.js";
import { loadHarnessConfig } from "../config/load-harness-config.js";

export interface UpdateOptions {
  overwrite?: boolean;
  dryRun?: boolean;
  full?: boolean;
}

export async function runUpdate(opts: UpdateOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const configPath = resolve(cwd, ".harness/config.yaml");

  if (!existsSync(configPath)) {
    console.log("No .harness/config.yaml found. Run `harn init` first.");
    process.exitCode = 1;
    return;
  }

  console.log("Agent Harness Update");
  console.log("====================\n");

  const loaded = loadHarnessConfig(cwd);
  if (!loaded.valid || !loaded.config) {
    console.error("Invalid .harness/config.yaml:");
    for (const e of loaded.errors) {
      console.error(`  ${e}`);
    }
    process.exitCode = 1;
    return;
  }

  const config = loaded.config;
  const wf = config.workflows;
  const commands =
    wf.commands && Object.keys(wf.commands).length > 0 ? wf.commands : undefined;
  const verificationChecks =
    wf.verification.checks && wf.verification.checks.length > 0
      ? wf.verification.checks
      : undefined;

  const useIncremental = !opts.full && !opts.overwrite;
  const mode = useIncremental ? "incremental" : "full";

  if (opts.dryRun) {
    console.log("  Mode: dry-run (no files will be written)\n");
  } else {
    console.log(`  Mode: ${mode}\n`);
  }

  const plan = resolveScaffold({
    cwd,
    projectName: config.project.name,
    projectType: config.project.type,
    tools: config.tools,
    toolpacks: config.toolpacks ?? [],
    skipDocs: config.skip_docs ?? false,
    ...(commands ? { commands } : {}),
    ...(verificationChecks ? { verificationChecks } : {}),
    ...(config.custom_rules !== undefined ? { customRulesFromConfig: config.custom_rules } : {}),
  });

  const previousFiles = Array.isArray(config.generated_files) ? config.generated_files : undefined;

  if (opts.dryRun && previousFiles && previousFiles.length > 0) {
    const { removed } = diffPlan(cwd, plan.files, previousFiles);
    if (removed.length > 0) {
      console.log(
        "  No longer in harness plan (previous generated_files only; safe to delete manually if you do not need them):",
      );
      for (const p of removed) {
        console.log(`    - ${p}`);
      }
      console.log("");
    }
  }

  const result = await generateFiles(cwd, plan.files, {
    overwrite: opts.full || opts.overwrite,
    mode,
    dryRun: opts.dryRun,
    mergeStrategy: opts.full || opts.overwrite ? "overwrite" : "keep-manual",
  });

  if (result.created.length > 0) {
    console.log(`  ${opts.dryRun ? "Would create" : "Created"}:`);
    for (const f of result.created) {
      console.log(`    + ${f}`);
    }
  }

  if (result.updated.length > 0) {
    console.log(`  ${opts.dryRun ? "Would update" : "Updated"}:`);
    for (const f of result.updated) {
      console.log(`    ~ ${f}`);
    }
  }

  if (result.unchanged.length > 0) {
    console.log(`  Unchanged: ${result.unchanged.length} file(s)`);
  }

  if (result.skipped.length > 0) {
    console.log(`  Skipped: ${result.skipped.length} file(s)`);
  }

  const changed = result.created.length + result.updated.length;
  if (opts.dryRun) {
    console.log(`\nDry run complete. ${changed} file(s) would be changed.`);
  } else {
    const manifestResult = refreshHarnessManifest(cwd);
    if (!manifestResult.ok) {
      console.log(`\n  [WARN] Could not write .harness/manifest.json: ${manifestResult.errors.join("; ")}`);
    }
    console.log(`\nUpdate complete! ${changed} file(s) changed, ${result.unchanged.length} unchanged.`);
  }
}
