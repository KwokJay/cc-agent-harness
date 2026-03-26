import type { ParsedSkill, SkillSource } from "./parser.js";
import { hashBody, serializeSkill } from "./parser.js";

export type MergeStrategy = "overwrite" | "keep-manual" | "merge";

export interface MergeDecision {
  action: "create" | "update" | "skip";
  content: string;
  reason: string;
}

export function mergeSkill(
  existing: ParsedSkill | null,
  generated: ParsedSkill,
  strategy: MergeStrategy = "keep-manual",
): MergeDecision {
  if (!existing) {
    return {
      action: "create",
      content: serializeSkill(generated),
      reason: "New skill, no existing file",
    };
  }

  if (strategy === "overwrite") {
    return {
      action: "update",
      content: serializeSkill(generated),
      reason: "Overwrite strategy: always replace",
    };
  }

  if (existing.source === "manual") {
    return {
      action: "skip",
      content: serializeSkill(existing),
      reason: "Manual skill: never overwritten",
    };
  }

  if (existing.source === "ai-extraction") {
    if (generated.version > existing.version) {
      return {
        action: "update",
        content: serializeSkill(generated),
        reason: `AI extraction updated: v${existing.version} → v${generated.version}`,
      };
    }
    return {
      action: "skip",
      content: serializeSkill(existing),
      reason: `AI extraction: generated version (${generated.version}) not newer than existing (${existing.version})`,
    };
  }

  if (wasManuallyEdited(existing)) {
    return {
      action: "skip",
      content: serializeSkill({ ...existing, source: "manual" }),
      reason: "Detected manual edits: body hash differs from generated, treating as manual",
    };
  }

  return {
    action: "update",
    content: serializeSkill(generated),
    reason: `${existing.source} skill updated: v${existing.version} → v${generated.version}`,
  };
}

function wasManuallyEdited(skill: ParsedSkill): boolean {
  if (skill.source !== "static-analysis" && skill.source !== "preset") {
    return false;
  }
  const currentHash = hashBody(skill.body);
  return currentHash !== skill.bodyHash;
}
