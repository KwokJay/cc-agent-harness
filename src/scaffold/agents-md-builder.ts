import type { DetectedProject, WorkflowCommands } from "../project-types/types.js";
import { getDocsConstraintParagraph } from "../docs-scaffold/generator.js";

export interface AgentsMdOptions {
  projectName: string;
  project: DetectedProject;
  commands: WorkflowCommands;
  verificationChecks: string[];
  customRules: string[];
  skills: string[];
}

export function buildAgentsMd(opts: AgentsMdOptions): string {
  const sections: string[] = [];

  sections.push(`# ${opts.projectName}`);
  sections.push("");
  sections.push("## Project Info");
  sections.push("");
  sections.push(`- **Type**: ${opts.project.type}`);
  sections.push(`- **Language**: ${opts.project.language}`);
  if (opts.project.framework) {
    sections.push(`- **Framework**: ${opts.project.framework}`);
  }
  sections.push("");

  sections.push("## Coding Guidelines");
  sections.push("");
  sections.push("- Follow established project conventions and style guides.");
  sections.push("- Write clear, self-documenting code with minimal comments.");
  sections.push("- Prefer editing existing files over creating new ones.");
  sections.push("- Run tests after making changes to verify correctness.");
  sections.push("- Run linters/formatters before finalizing changes.");
  sections.push("");

  if (opts.customRules.length > 0) {
    sections.push("## Project-Specific Rules");
    sections.push("");
    for (const rule of opts.customRules) {
      sections.push(`- ${rule}`);
    }
    sections.push("");
  }

  const commandEntries = Object.entries(opts.commands);
  if (commandEntries.length > 0) {
    sections.push("## Available Commands");
    sections.push("");
    sections.push("| Command | Description |");
    sections.push("|---------|-------------|");
    for (const [name, cmd] of commandEntries) {
      sections.push(`| \`${cmd}\` | ${name} |`);
    }
    sections.push("");
  }

  if (opts.verificationChecks.length > 0) {
    sections.push("## Verification Protocol");
    sections.push("");
    sections.push("Before claiming any task is complete:");
    sections.push("");
    for (let i = 0; i < opts.verificationChecks.length; i++) {
      const check = opts.verificationChecks[i];
      const cmd = opts.commands[check];
      sections.push(`${i + 1}. Run \`${cmd ?? check}\` to verify ${check}.`);
    }
    sections.push("");
  }

  sections.push(getDocsConstraintParagraph());

  if (opts.skills.length > 0) {
    sections.push("## Skills");
    sections.push("");
    sections.push("The following skill packs are available in `.harness/skills/`:");
    sections.push("");
    for (const skill of opts.skills) {
      sections.push(`- **${skill}**`);
    }
    sections.push("");
  }

  return sections.join("\n");
}
