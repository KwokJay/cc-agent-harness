import { HarnessRuntime } from "../runtime/harness.js";
import type { TagStyle } from "../context/types.js";

export interface ContextBuildCliOptions {
  format?: TagStyle;
  output?: string;
  includeSkills?: boolean;
  includeRules?: boolean;
}

export async function runContextBuild(
  opts: ContextBuildCliOptions,
): Promise<void> {
  const runtime = await HarnessRuntime.create({ requireProjectConfig: true });
  const tagStyle = opts.format ?? "markdown";

  if (opts.output) {
    const result = await runtime.writeContext({
      outputPath: opts.output,
      tagStyle,
      includeSkills: opts.includeSkills,
      includeCustomRules: opts.includeRules,
    });
    console.log(`Context written to ${opts.output}`);
    console.log(`Blocks included: ${result.blocks.length}`);
    return;
  }

  const result = await runtime.buildContext({
    tagStyle,
    includeSkills: opts.includeSkills,
    includeCustomRules: opts.includeRules,
  });
  console.log(result.rendered);
}
