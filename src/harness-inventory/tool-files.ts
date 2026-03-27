/**
 * Harness-generated paths expected per AI tool (project rules / entry files).
 */
export function getExpectedToolHarnessFiles(tool: string): string[] | undefined {
  const fileMap: Record<string, string[]> = {
    cursor: [".cursor/rules/project.mdc"],
    "claude-code": ["CLAUDE.md"],
    copilot: [".github/copilot-instructions.md"],
    codex: [".codex/config.toml"],
    opencode: ["opencode.json"],
    windsurf: [".windsurf/rules/project.md"],
    trae: [".trae/rules/project.md"],
    augment: ["augment-guidelines.md"],
  };
  return fileMap[tool];
}
