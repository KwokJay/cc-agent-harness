import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import type { HookHandler } from "./types.js";

const HOOKS_FILE_NAMES = ["hooks.yaml", "hooks.json"];

export async function discoverHooks(cwd: string): Promise<HookHandler[]> {
  const handlers: HookHandler[] = [];

  const harnessDir = resolve(cwd, ".harness");
  for (const fileName of HOOKS_FILE_NAMES) {
    const filePath = resolve(harnessDir, fileName);
    if (!existsSync(filePath)) continue;

    const content = await readFile(filePath, "utf-8");
    const parsed = fileName.endsWith(".json")
      ? JSON.parse(content)
      : parseYaml(content);

    if (parsed && Array.isArray(parsed.hooks)) {
      for (const hook of parsed.hooks) {
        if (hook.event && hook.command) {
          handlers.push({
            event: hook.event,
            command: hook.command,
            matcher: hook.matcher,
          });
        }
      }
    }

    break;
  }

  return handlers;
}
