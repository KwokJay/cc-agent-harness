export const CODEX_CONFIG_TOML_TEMPLATE = `# Codex project configuration
# See https://developers.openai.com/codex/config-reference

{{#if hasVerification}}# Run verification after changes
developer_instructions = "After making changes, always run: {{verifyCommand}}"
{{/if}}`;

export const CODEX_SKILL_TEMPLATE = `---
name: {{name}}
description: {{description}}
---

{{body}}
`;
