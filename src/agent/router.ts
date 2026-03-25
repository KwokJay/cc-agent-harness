import type { ModelTier } from "../config/schema.js";

export type TaskComplexity = "low" | "medium" | "high";

export interface ModelRouting {
  low: ModelTier;
  medium: ModelTier;
  high: ModelTier;
}

const DEFAULT_ROUTING: ModelRouting = {
  low: "low",
  medium: "medium",
  high: "high",
};

export function routeModel(
  complexity: TaskComplexity,
  routing?: Partial<ModelRouting>,
): ModelTier {
  const merged = { ...DEFAULT_ROUTING, ...routing };
  return merged[complexity];
}

const COMPLEXITY_KEYWORDS: Record<string, TaskComplexity> = {
  lookup: "low",
  find: "low",
  "quick check": "low",
  implement: "medium",
  add: "medium",
  fix: "medium",
  refactor: "high",
  debug: "high",
  architect: "high",
  "race condition": "high",
};

export function inferComplexity(taskDescription: string): TaskComplexity {
  const lower = taskDescription.toLowerCase();
  for (const [keyword, complexity] of Object.entries(COMPLEXITY_KEYWORDS)) {
    if (lower.includes(keyword)) return complexity;
  }
  return "medium";
}
