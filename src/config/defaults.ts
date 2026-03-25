import type { AgentDefinition } from "./schema.js";

export const BUILT_IN_AGENTS: AgentDefinition[] = [
  { name: "architect-low", domain: "analysis", tier: "haiku" },
  { name: "architect-medium", domain: "analysis", tier: "sonnet" },
  { name: "architect", domain: "analysis", tier: "opus" },
  { name: "executor-low", domain: "execution", tier: "haiku" },
  { name: "executor", domain: "execution", tier: "sonnet" },
  { name: "executor-high", domain: "execution", tier: "opus" },
  { name: "explore", domain: "search", tier: "haiku" },
  { name: "explore-medium", domain: "search", tier: "sonnet" },
  { name: "explore-high", domain: "search", tier: "opus" },
  { name: "researcher-low", domain: "research", tier: "haiku" },
  { name: "researcher", domain: "research", tier: "sonnet" },
  { name: "designer-low", domain: "frontend", tier: "haiku" },
  { name: "designer", domain: "frontend", tier: "sonnet" },
  { name: "designer-high", domain: "frontend", tier: "opus" },
  { name: "writer", domain: "docs", tier: "haiku" },
  { name: "vision", domain: "visual", tier: "sonnet" },
  { name: "planner", domain: "planning", tier: "opus" },
  { name: "critic", domain: "critique", tier: "opus" },
  { name: "analyst", domain: "pre-planning", tier: "opus" },
  { name: "qa-tester", domain: "testing", tier: "sonnet" },
  { name: "qa-tester-high", domain: "testing", tier: "opus" },
  { name: "security-reviewer-low", domain: "security", tier: "haiku" },
  { name: "security-reviewer", domain: "security", tier: "opus" },
  { name: "build-fixer-low", domain: "build", tier: "haiku" },
  { name: "build-fixer", domain: "build", tier: "sonnet" },
  { name: "tdd-guide-low", domain: "tdd", tier: "haiku" },
  { name: "tdd-guide", domain: "tdd", tier: "sonnet" },
  { name: "code-reviewer-low", domain: "code-review", tier: "haiku" },
  { name: "code-reviewer", domain: "code-review", tier: "opus" },
  { name: "scientist-low", domain: "data-science", tier: "haiku" },
  { name: "scientist", domain: "data-science", tier: "sonnet" },
  { name: "scientist-high", domain: "data-science", tier: "opus" },
];

export const DEFAULT_SKILL_DIRECTORIES = [".codex/skills", ".harness/skills"];

export const DEFAULT_VERIFICATION_CHECKS = ["build", "test", "lint"];
