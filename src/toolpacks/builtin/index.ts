import type { ToolpackPlugin } from "../plugin.js";
import { contextModePlugin } from "./context-mode.js";
import { rtkPlugin } from "./rtk.js";
import { understandAnythingPlugin } from "./understand-anything.js";
import { gstackPlugin } from "./gstack.js";

export function loadBuiltinToolpacks(): ToolpackPlugin[] {
  return [
    contextModePlugin,
    rtkPlugin,
    understandAnythingPlugin,
    gstackPlugin,
  ];
}
