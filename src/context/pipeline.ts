import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { HarnessConfig } from "../config/schema.js";
import { discoverSkills } from "../skill/manager.js";
import type { ContextBlock, ContextPipelineResult } from "./types.js";

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

  build(): ContextPipelineResult {
    const sorted = [...this.blocks].sort((a, b) => a.priority - b.priority);
    const parts: string[] = [];

    for (const block of sorted) {
      parts.push(`<!-- ${block.tag} -->`);
      parts.push(block.content);
      parts.push(`<!-- /${block.tag} -->`);
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
