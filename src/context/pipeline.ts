import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname, parse as parsePath } from "node:path";
import type { HarnessConfig } from "../config/schema.js";
import { discoverSkills } from "../skill/manager.js";
import type { ContextBlock, ContextPipelineResult, ContextBuildOptions, TagStyle } from "./types.js";

export class ContextPipeline {
  private blocks: ContextBlock[] = [];

  addBlock(tag: string, content: string, priority = 50): void {
    this.blocks.push({ tag, content, priority });
  }

  async addProjectDoc(cwd: string): Promise<void> {
    const agentsMd = resolve(cwd, "AGENTS.md");
    if (existsSync(agentsMd)) {
      const content = await readFile(agentsMd, "utf-8");
      this.addBlock("project-doc", content, 10);
    }
  }

  /**
   * Walk from projectRoot to cwd, collecting AGENTS.md files.
   * Deeper files override shallower ones (later blocks have higher priority).
   */
  async addHierarchicalDocs(cwd: string, projectRoot?: string): Promise<void> {
    const root = projectRoot ?? await findProjectRoot(cwd);
    const docs = collectAgentsMdFiles(root, cwd);

    for (let i = 0; i < docs.length; i++) {
      const filePath = docs[i];
      const content = await readFile(filePath, "utf-8");
      const depth = i;
      this.addBlock(`agents-md-${depth}`, content, 10 + depth);
    }
  }

  async addSkillsSummary(config: HarnessConfig, cwd: string): Promise<void> {
    const skills = await discoverSkills(config.skills.directories, cwd);
    if (skills.length === 0) return;

    const lines = ["Available skills:"];
    for (const skill of skills) {
      if (skill.valid) {
        lines.push(`- ${skill.name}: ${skill.description}`);
      }
    }
    this.addBlock("skills", lines.join("\n"), 30);
  }

  addCustomRules(rules: string[]): void {
    if (rules.length === 0) return;
    const content = rules.map((r) => `- ${r}`).join("\n");
    this.addBlock("custom-rules", content, 20);
  }

  addRaw(tag: string, content: string, priority?: number): void {
    this.addBlock(tag, content, priority);
  }

  build(options?: ContextBuildOptions): ContextPipelineResult {
    const sorted = [...this.blocks].sort((a, b) => a.priority - b.priority);
    const tagStyle: TagStyle = options?.tagStyle ?? "markdown";
    const parts: string[] = [];

    for (const block of sorted) {
      const [open, close] = formatTags(block.tag, tagStyle);
      if (open) parts.push(open);
      parts.push(block.content);
      if (close) parts.push(close);
      parts.push("");
    }

    return {
      blocks: sorted,
      rendered: parts.join("\n").trim(),
    };
  }

  clear(): void {
    this.blocks = [];
  }
}

function formatTags(tag: string, style: TagStyle): [string | null, string | null] {
  switch (style) {
    case "xml":
      return [`<${tag}>`, `</${tag}>`];
    case "markdown":
      return [`<!-- ${tag} -->`, `<!-- /${tag} -->`];
    case "none":
      return [null, null];
  }
}

function collectAgentsMdFiles(root: string, cwd: string): string[] {
  const files: string[] = [];
  let current = resolve(root);
  const target = resolve(cwd);

  while (true) {
    const agentsMd = resolve(current, "AGENTS.md");
    if (existsSync(agentsMd)) {
      files.push(agentsMd);
    }
    if (current === target) break;

    const next = resolve(current, relativeStep(current, target));
    if (next === current) break;
    current = next;
  }

  return files;
}

function relativeStep(from: string, to: string): string {
  const fromParts = from.split("/").filter(Boolean);
  const toParts = to.split("/").filter(Boolean);
  if (toParts.length > fromParts.length) {
    return toParts[fromParts.length];
  }
  return "";
}

async function findProjectRoot(cwd: string): Promise<string> {
  let dir = resolve(cwd);
  while (true) {
    if (existsSync(resolve(dir, ".harness")) || existsSync(resolve(dir, ".git"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return cwd;
    dir = parent;
  }
}
