import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildManifest } from "../manifest/build.js";
import type { HarnessManifest } from "../manifest/types.js";

export type ExportFormat = "json" | "md";

export interface ExportCliOptions {
  format?: ExportFormat;
  out?: string;
  /** @internal testing */
  cwd?: string;
}

function manifestToMarkdown(m: HarnessManifest): string {
  const lines: string[] = [
    "# Harness export",
    "",
    `Generated at: ${m.generatedAt}`,
    `Harness CLI: ${m.harnessCliVersion}`,
    `Manifest schema: ${m.manifestVersion}`,
    "",
    "## Project",
    "",
    `- **Name:** ${m.project.name}`,
    `- **Type:** ${m.project.type}`,
    `- **Language:** ${m.project.language}`,
    ...(m.project.framework ? [`- **Framework:** ${m.project.framework}`] : []),
    "",
    "## Tools",
    "",
    ...m.tools.map((t) => `- ${t}`),
    "",
    "## Toolpacks",
    "",
    ...(m.toolpacks.length === 0
      ? ["_(none)_", ""]
      : m.toolpacks.map(
          (p) =>
            `- **${p.id}** (${p.packSource} ${p.packVersion}${p.sharedPolicy ? "; sharedPolicy" : ""})`,
        )),
    "",
    "## Skills",
    "",
    `- **Count:** ${m.skills.count}`,
    ...(m.skills.ids.length ? ["", ...m.skills.ids.map((id) => `- ${id}`)] : []),
    "",
    "## Verification",
    "",
    ...(m.verification.checks.length === 0
      ? ["_(no checks configured)_", ""]
      : m.verification.checks.map((c) => `- **${c.name}:** \`${c.command || "(missing command)"}\``)),
    "",
    "## Generated files",
    "",
    `- **Tracked count (config):** ${m.generatedFilesCount}`,
    "",
    "## Adoption",
    "",
    `- **Tools enabled:** ${m.adoption.toolsEnabled}`,
    `- **Toolpacks enabled:** ${m.adoption.toolpacksEnabled}`,
    `- **Official toolpacks:** ${m.adoption.officialToolpacksEnabled}`,
    `- **Skills discovered:** ${m.adoption.skillsDiscovered}`,
    `- **Verification checks configured:** ${m.adoption.verificationChecksConfigured}`,
    "",
    "## Health",
    "",
    ...(m.health.lastVerifyAt !== undefined
      ? [
          `- **Last verify:** ${m.health.lastVerifyAt} (${m.health.lastVerifyOk ? "ok" : "failed"})`,
        ]
      : ["- **Last verify:** _(no .harness/state/last-verify.json)_"]),
    `- **Days since verify:** ${m.health.daysSinceLastVerify === null ? "unknown" : m.health.daysSinceLastVerify.toFixed(2)}`,
    `- **Generated files on disk:** ${m.health.generatedFilesPresentOnDisk} / ${m.health.generatedFilesTracked} (coverage ${(m.health.artifactCoverageRatio * 100).toFixed(1)}%)`,
    "",
    ...(m.aggregation !== undefined
      ? [
          "## Aggregation",
          "",
          `- **org:** ${m.aggregation.org ?? "_(unset)_"}`,
          `- **repo_slug:** ${m.aggregation.repo_slug ?? "_(unset)_"}`,
          "",
        ]
      : []),
    ...(m.approved_exceptions !== undefined && m.approved_exceptions.length > 0
      ? [
          "## Approved exceptions",
          "",
          ...m.approved_exceptions.flatMap((e) => {
            const bits = [`- **${e.id}**`];
            if (e.description) bits.push(`  - ${e.description}`);
            if (e.target) bits.push(`  - target: \`${e.target}\``);
            bits.push("");
            return bits;
          }),
        ]
      : []),
  ];
  return lines.join("\n");
}

export async function runExport(opts: ExportCliOptions = {}): Promise<void> {
  const format: ExportFormat = opts.format ?? "md";
  const cwd = opts.cwd ?? process.cwd();
  const r = buildManifest(cwd);
  if (!r.ok) {
    console.error("export: invalid or missing .harness/config.yaml");
    for (const e of r.errors) console.error(`  ${e}`);
    process.exitCode = 1;
    return;
  }

  const content =
    format === "json" ? `${JSON.stringify(r.manifest, null, 2)}\n` : manifestToMarkdown(r.manifest);

  if (opts.out) {
    const absOut = resolve(cwd, opts.out);
    writeFileSync(absOut, content, "utf-8");
    console.log(`Wrote ${absOut}`);
  } else {
    process.stdout.write(content);
  }
}
