import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadHarnessConfig } from "../config/load-harness-config.js";
import { discoverHarnessSkillIds } from "../harness-inventory/index.js";
import { getHarnessVersion } from "../cli/harness-version.js";
import { readLastVerifyState, daysSinceLastVerify } from "../cli/verify.js";
import { getToolpack } from "../toolpacks/registry.js";
import { HARNESS_MANIFEST_VERSION, type HarnessManifest } from "./types.js";

function computeArtifactCoverage(
  cwd: string,
  relPaths: string[] | undefined,
): { tracked: number; present: number; ratio: number } {
  const paths = Array.isArray(relPaths) ? relPaths : [];
  const tracked = paths.length;
  if (tracked === 0) {
    return { tracked: 0, present: 0, ratio: 1 };
  }
  let present = 0;
  for (const rel of paths) {
    const abs = resolve(cwd, rel);
    if (existsSync(abs)) present += 1;
  }
  return { tracked, present, ratio: present / tracked };
}

export type BuildManifestResult =
  | { ok: true; manifest: HarnessManifest }
  | { ok: false; errors: string[] };

/**
 * Build a machine-readable harness manifest from `.harness/config.yaml` and workspace scan.
 */
export function buildManifest(cwd: string): BuildManifestResult {
  const loaded = loadHarnessConfig(cwd);
  if (!loaded.valid || !loaded.config) {
    return { ok: false, errors: loaded.errors };
  }

  const config = loaded.config;
  const skillIds = discoverHarnessSkillIds(cwd);
  const packIds = config.toolpacks ?? [];
  const toolpacks = packIds.map((id) => {
    const tp = getToolpack(id, cwd);
    const entry: import("./types.js").HarnessManifestToolpackEntry = {
      id,
      packSource: tp?.packSource ?? "unknown",
      packVersion: tp?.packVersion ?? "",
    };
    if (tp) {
      entry.provenance = tp.provenance;
      if (tp.verificationHint !== undefined) {
        entry.verificationHint = tp.verificationHint;
      }
      if (tp.sharedPolicy) {
        entry.sharedPolicy = true;
      }
    }
    return entry;
  });

  const checks = config.workflows.verification.checks;
  const commands = config.workflows.commands;
  const verificationChecks = checks.map((name) => ({
    name,
    command: typeof commands[name] === "string" ? commands[name] : "",
  }));

  const generatedFiles = config.generated_files;
  const generatedFilesCount = Array.isArray(generatedFiles) ? generatedFiles.length : 0;

  let officialToolpacksEnabled = 0;
  for (const id of packIds) {
    const tp = getToolpack(id, cwd);
    if (tp?.provenance === "official") {
      officialToolpacksEnabled += 1;
    }
  }

  const lastVerify = readLastVerifyState(cwd);
  const cov = computeArtifactCoverage(cwd, config.generated_files);

  const manifest: HarnessManifest = {
    manifestVersion: HARNESS_MANIFEST_VERSION,
    generatedAt: new Date().toISOString(),
    harnessCliVersion: getHarnessVersion(),
    project: {
      name: config.project.name,
      type: config.project.type,
      language: config.project.language,
      ...(config.project.framework !== undefined ? { framework: config.project.framework } : {}),
    },
    tools: [...config.tools],
    toolpacks,
    skills: { count: skillIds.length, ids: skillIds },
    verification: { checks: verificationChecks },
    generatedFilesCount,
    adoption: {
      toolsEnabled: config.tools.length,
      toolpacksEnabled: packIds.length,
      officialToolpacksEnabled,
      skillsDiscovered: skillIds.length,
      verificationChecksConfigured: checks.length,
    },
    health: {
      ...(lastVerify
        ? { lastVerifyAt: lastVerify.timestamp, lastVerifyOk: lastVerify.ok }
        : {}),
      daysSinceLastVerify: daysSinceLastVerify(cwd),
      generatedFilesTracked: cov.tracked,
      generatedFilesPresentOnDisk: cov.present,
      artifactCoverageRatio: cov.ratio,
    },
    ...(config.aggregation !== undefined ? { aggregation: config.aggregation } : {}),
    ...(config.approved_exceptions !== undefined && config.approved_exceptions.length > 0
      ? { approved_exceptions: config.approved_exceptions }
      : {}),
  };

  return { ok: true, manifest };
}
