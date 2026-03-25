import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { zodToJsonSchema } from "zod-to-json-schema";
import { harnessConfigSchema } from "../config/schema.js";

export interface SchemaGenerateOptions {
  output?: string;
}

export async function runSchemaGenerate(opts: SchemaGenerateOptions): Promise<void> {
  const outputPath = opts.output ?? resolve(process.cwd(), ".harness/schema.json");

  console.log("Agent Harness Schema Generator");
  console.log("==============================\n");

  const jsonSchema = zodToJsonSchema(harnessConfigSchema, {
    name: "HarnessConfig",
    $refStrategy: "none",
  });

  await mkdir(dirname(outputPath), { recursive: true });
  const content = JSON.stringify(jsonSchema, null, 2);
  await writeFile(outputPath, content + "\n", "utf-8");

  console.log(`  Generated JSON Schema at ${outputPath}`);
  console.log(`  Schema size: ${content.length} bytes`);
}
