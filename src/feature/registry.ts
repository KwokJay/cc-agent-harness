import type { FeatureSpec, FeatureStage } from "./types.js";

export class FeatureRegistry {
  private specs: Map<string, FeatureSpec> = new Map();
  private overrides: Map<string, boolean> = new Map();

  register(spec: FeatureSpec): void {
    this.specs.set(spec.id, spec);
  }

  registerMany(specs: FeatureSpec[]): void {
    for (const spec of specs) {
      this.register(spec);
    }
  }

  applyOverrides(overrides: Record<string, boolean>): void {
    for (const [key, value] of Object.entries(overrides)) {
      const spec = this.findByKey(key);
      if (spec) {
        this.overrides.set(spec.id, value);
      }
    }
  }

  isEnabled(id: string): boolean {
    const override = this.overrides.get(id);
    if (override !== undefined) return override;

    const spec = this.specs.get(id);
    if (!spec) return false;
    return spec.defaultEnabled;
  }

  get(id: string): FeatureSpec | undefined {
    return this.specs.get(id);
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

  private findByKey(key: string): FeatureSpec | undefined {
    for (const spec of this.specs.values()) {
      if (spec.key === key || spec.id === key) return spec;
    }
    return undefined;
  }
}
