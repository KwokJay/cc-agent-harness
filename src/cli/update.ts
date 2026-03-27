import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { resolve as resolveScaffold } from "../scaffold/resolver.js";
import { generateFiles } from "../scaffold/generator.js";
import { diffPlan } from "../scaffold/differ.js";
import { refreshHarnessManifest } from "../manifest/refresh.js";
import type { ProjectTypeId } from "../project-types/types.js";
import type { ToolId } from "../tool-adapters/types.js";

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

  const config = parseYaml(readFileSync(configPath, "utf-8")) as Record<string, unknown>;
  const project = config.project as Record<string, string> | undefined;
  const projectName = project?.name ?? basename(cwd);
  const projectType = (project?.type ?? "backend") as ProjectTypeId;
  const tools = ((config.tools as string[]) ?? ["cursor", "claude-code"]) as ToolId[];
  const toolpacks = (config.toolpacks as string[] | undefined) ?? [];
  const skipDocs = (config.skip_docs as boolean | undefined) ?? false;

  const useIncremental = !opts.full && !opts.overwrite;
  const mode = useIncremental ? "incremental" : "full";

  if (opts.dryRun) {
    console.log("  Mode: dry-run (no files will be written)\n");
  } else {
    console.log(`  Mode: ${mode}\n`);
  }

  const plan = resolveScaffold({
    cwd,
    projectName,
    projectType,
    tools,
    toolpacks,
    skipDocs,
  });

  const previousFiles = Array.isArray(config.generated_files)
    ? (config.generated_files as string[])
    : undefined;

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
