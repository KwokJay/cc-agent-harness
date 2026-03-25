import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { join, dirname, relative } from "node:path";
import { render, type TemplateContext } from "./engine.js";

const TEMPLATE_EXT = ".tmpl";

export async function renderFile(
  templatePath: string,
  outputPath: string,
  context: TemplateContext,
): Promise<void> {
  const template = await readFile(templatePath, "utf-8");
  const rendered = render(template, context);

  const outputFile = outputPath.endsWith(TEMPLATE_EXT)
    ? outputPath.slice(0, -TEMPLATE_EXT.length)
    : outputPath;

  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, rendered, "utf-8");
}

export async function renderDirectory(
  templateDir: string,
  outputDir: string,
  context: TemplateContext,
): Promise<string[]> {
  const rendered: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relPath = relative(templateDir, fullPath);
      const outPath = join(outputDir, relPath);
      const info = await stat(fullPath);

      if (info.isDirectory()) {
        await mkdir(outPath, { recursive: true });
        await walk(fullPath);
      } else if (entry.endsWith(TEMPLATE_EXT)) {
        await renderFile(fullPath, outPath, context);
        rendered.push(outPath.slice(0, -TEMPLATE_EXT.length));
      }
    }
  }

  await walk(templateDir);
  return rendered;
}
