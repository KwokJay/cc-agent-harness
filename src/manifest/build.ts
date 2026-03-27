import { loadHarnessConfig } from "../config/load-harness-config.js";
import { discoverHarnessSkillIds } from "../harness-inventory/index.js";
import { getHarnessVersion } from "../cli/harness-version.js";
import { getToolpack } from "../toolpacks/registry.js";
import { HARNESS_MANIFEST_VERSION, type HarnessManifest } from "./types.js";

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
    return {
      id,
      packSource: tp?.packSource ?? "unknown",
      packVersion: tp?.packVersion ?? "",
    };
  });

  const checks = config.workflows.verification.checks;
  const commands = config.workflows.commands;
  const verificationChecks = checks.map((name) => ({
    name,
    command: typeof commands[name] === "string" ? commands[name] : "",
  }));

  const generatedFiles = config.generated_files;
  const generatedFilesCount = Array.isArray(generatedFiles) ? generatedFiles.length : 0;

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
  };

  return { ok: true, manifest };
}
