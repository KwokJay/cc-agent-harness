import type { ToolAdapter, ToolId, ToolCapability } from "./types.js";
import { CursorAdapter } from "./cursor.js";
import { ClaudeCodeAdapter } from "./claude-code.js";
import { CopilotAdapter } from "./copilot.js";
import { CodexAdapter } from "./codex.js";
import { OpenCodeAdapter } from "./opencode.js";
import { WindsurfAdapter } from "./windsurf.js";
import { TraeAdapter } from "./trae.js";
import { AugmentAdapter } from "./augment.js";

export type {
  ToolAdapter,
  ToolId,
  ToolAdapterContext,
  GeneratedFile,
  ToolCapability,
  SupportTier,
} from "./types.js";

const ALL_ADAPTERS: ToolAdapter[] = [
  new CursorAdapter(),
  new ClaudeCodeAdapter(),
  new CopilotAdapter(),
  new CodexAdapter(),
  new OpenCodeAdapter(),
  new WindsurfAdapter(),
  new TraeAdapter(),
  new AugmentAdapter(),
];

/** Derived from registered adapters — single source of truth. */
export const ALL_TOOL_IDS: ToolId[] = ALL_ADAPTERS.map((a) => a.id);

/** Derived from registered adapters — single source of truth. */
export const TOOL_CAPABILITIES: Record<ToolId, ToolCapability> =
  Object.fromEntries(ALL_ADAPTERS.map((a) => [a.id, a.capability])) as Record<ToolId, ToolCapability>;

export function getToolCapability(id: ToolId): ToolCapability {
  return TOOL_CAPABILITIES[id];
}

export function getToolAdapter(id: ToolId): ToolAdapter {
  const adapter = ALL_ADAPTERS.find((a) => a.id === id);
  if (!adapter) throw new Error(`Unknown tool: ${id}`);
  return adapter;
}

export function listToolAdapters(): ToolAdapter[] {
  return [...ALL_ADAPTERS];
}
