import type { AgentDefinition } from "./schema.js";

export const BUILT_IN_AGENTS: AgentDefinition[] = [
  { name: "architect-low", domain: "analysis", tier: "low" },
  { name: "architect-medium", domain: "analysis", tier: "medium" },
  { name: "architect", domain: "analysis", tier: "high" },
  { name: "executor-low", domain: "execution", tier: "low" },
  { name: "executor", domain: "execution", tier: "medium" },
  { name: "executor-high", domain: "execution", tier: "high" },
  { name: "explore", domain: "search", tier: "low" },
  { name: "explore-medium", domain: "search", tier: "medium" },
  { name: "explore-high", domain: "search", tier: "high" },
  { name: "researcher-low", domain: "research", tier: "low" },
  { name: "researcher", domain: "research", tier: "medium" },
  { name: "designer-low", domain: "frontend", tier: "low" },
  { name: "designer", domain: "frontend", tier: "medium" },
  { name: "designer-high", domain: "frontend", tier: "high" },
  { name: "writer", domain: "docs", tier: "low" },
  { name: "vision", domain: "visual", tier: "medium" },
  { name: "planner", domain: "planning", tier: "high" },
  { name: "critic", domain: "critique", tier: "high" },
  { name: "analyst", domain: "pre-planning", tier: "high" },
  { name: "qa-tester", domain: "testing", tier: "medium" },
  { name: "qa-tester-high", domain: "testing", tier: "high" },
  { name: "security-reviewer-low", domain: "security", tier: "low" },
  { name: "security-reviewer", domain: "security", tier: "high" },
  { name: "build-fixer-low", domain: "build", tier: "low" },
  { name: "build-fixer", domain: "build", tier: "medium" },
  { name: "tdd-guide-low", domain: "tdd", tier: "low" },
  { name: "tdd-guide", domain: "tdd", tier: "medium" },
  { name: "code-reviewer-low", domain: "code-review", tier: "low" },
  { name: "code-reviewer", domain: "code-review", tier: "high" },
  { name: "scientist-low", domain: "data-science", tier: "low" },
  { name: "scientist", domain: "data-science", tier: "medium" },
  { name: "scientist-high", domain: "data-science", tier: "high" },
];

export const DEFAULT_SKILL_DIRECTORIES = [".harness/skills"];

export const DEFAULT_VERIFICATION_CHECKS = ["build", "test", "lint"];
