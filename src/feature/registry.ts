import type { FeatureSpec, FeatureStage } from "./types.js";

export class FeatureRegistry {
  private specs: Map<string, FeatureSpec> = new Map();
  private overrides: Map<string, boolean> = new Map();
  private aliases: Map<string, string> = new Map();
  private aliasUsages: string[] = [];

  register(spec: FeatureSpec): void {
    this.specs.set(spec.id, spec);
  }

  registerMany(specs: FeatureSpec[]): void {
    for (const spec of specs) {
      this.register(spec);
    }
  }

  registerAlias(legacyKey: string, featureId: string): void {
    this.aliases.set(legacyKey, featureId);
  }

  registerAliases(aliasMap: Record<string, string>): void {
    for (const [legacy, id] of Object.entries(aliasMap)) {
      this.registerAlias(legacy, id);
    }
  }

  applyOverrides(overrides: Record<string, boolean>): void {
    for (const [key, value] of Object.entries(overrides)) {
      const spec = this.findByKey(key);
      if (spec) {
        if (spec.stage === "removed") continue;
        this.overrides.set(spec.id, value);
      }
    }
  }

  isEnabled(id: string): boolean {
    const resolved = this.resolveAlias(id);

    const override = this.overrides.get(resolved);
    if (override !== undefined) return override;

    const spec = this.specs.get(resolved);
    if (!spec) return false;
    if (spec.stage === "removed") return false;
    return spec.defaultEnabled;
  }

  get(id: string): FeatureSpec | undefined {
    const resolved = this.resolveAlias(id);
    return this.specs.get(resolved);
  }

  list(): FeatureSpec[] {
    return [...this.specs.values()];
  }

  listByStage(stage: FeatureStage): FeatureSpec[] {
    return this.list().filter((s) => s.stage === stage);
  }

  listEnabled(): FeatureSpec[] {
    return this.list().filter((s) => this.isEnabled(s.id));
  }

  count(): { total: number; enabled: number; disabled: number } {
    const total = this.specs.size;
    const enabled = this.listEnabled().length;
    return { total, enabled, disabled: total - enabled };
  }

  getAliasUsages(): string[] {
    return [...this.aliasUsages];
  }

  private resolveAlias(key: string): string {
    const mapped = this.aliases.get(key);
    if (mapped) {
      this.aliasUsages.push(`Legacy key "${key}" resolved to "${mapped}"`);
      return mapped;
    }
    return key;
  }

  private findByKey(key: string): FeatureSpec | undefined {
    const resolved = this.resolveAlias(key);
    const direct = this.specs.get(resolved);
    if (direct) return direct;

    for (const spec of this.specs.values()) {
      if (spec.key === resolved || spec.id === resolved) return spec;
    }
    return undefined;
  }
}
