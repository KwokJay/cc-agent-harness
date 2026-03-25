import type { ProjectAdapter } from "./interface.js";
import { RustAdapter } from "./rust.js";
import { TypeScriptAdapter } from "./typescript.js";
import { PythonAdapter } from "./python.js";

const BUILT_IN_ADAPTERS: ProjectAdapter[] = [
  new RustAdapter(),
  new TypeScriptAdapter(),
  new PythonAdapter(),
];

export class AdapterRegistry {
  private adapters: Map<string, ProjectAdapter> = new Map();

  constructor(additionalAdapters: ProjectAdapter[] = []) {
    for (const adapter of BUILT_IN_ADAPTERS) {
      this.adapters.set(adapter.name, adapter);
    }
    for (const adapter of additionalAdapters) {
      this.adapters.set(adapter.name, adapter);
    }
  }

  register(adapter: ProjectAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  get(name: string): ProjectAdapter | undefined {
    return this.adapters.get(name);
  }

  list(): ProjectAdapter[] {
    return [...this.adapters.values()];
  }

  async detect(cwd: string): Promise<ProjectAdapter | null> {
    for (const adapter of this.adapters.values()) {
      if (await adapter.detect(cwd)) return adapter;
    }
    return null;
  }

  count(): { builtin: number; custom: number; total: number } {
    const builtin = BUILT_IN_ADAPTERS.length;
    const total = this.adapters.size;
    return { builtin, custom: total - builtin, total };
  }
}
