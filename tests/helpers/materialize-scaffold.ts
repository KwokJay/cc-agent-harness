import { loadHarnessConfig } from "../../src/config/load-harness-config.js";
import { resolve as resolveScaffold } from "../../src/scaffold/resolver.js";
import { generateFiles } from "../../src/scaffold/generator.js";

/** Writes canonical harness files for a valid `.harness/config.yaml` (for drift/diagnose tests). */
export async function materializeCanonicalScaffold(cwd: string): Promise<void> {
  const loaded = loadHarnessConfig(cwd);
  if (!loaded.valid || !loaded.config) {
    throw new Error(`Invalid harness config: ${loaded.errors.join("; ")}`);
  }
  const config = loaded.config;
  const wf = config.workflows;
  const commands =
    wf.commands && Object.keys(wf.commands).length > 0 ? wf.commands : undefined;
  const verificationChecks =
    wf.verification.checks && wf.verification.checks.length > 0
      ? wf.verification.checks
      : undefined;
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
  await generateFiles(cwd, plan.files, {
    mode: "full",
    mergeStrategy: "overwrite",
    overwrite: true,
  });
}
