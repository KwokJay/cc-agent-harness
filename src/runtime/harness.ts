import { dirname, resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { AgentRegistry } from "../agent/registry.js";
import { detectProjectType } from "../adapter/detector.js";
import type { CommandDefinition, ProjectAdapter } from "../adapter/interface.js";
import { AuditLogger } from "../audit/logger.js";
import type { AuditEventKind } from "../audit/types.js";
import {
  anyConfigExists,
  loadConfig,
  projectConfigExists,
  type HarnessConfig,
} from "../config/loader.js";
import { ContextPipeline } from "../context/pipeline.js";
import type { ContextPipelineResult, TagStyle } from "../context/types.js";
import { FeatureRegistry } from "../feature/registry.js";
import type { FeatureSpec } from "../feature/types.js";
import { discoverHooks } from "../hook/discovery.js";
import { HookDispatcher } from "../hook/dispatcher.js";
import type { HookEventName, HookResult } from "../hook/types.js";

export type RuntimeTaskSource = "adapter" | "workflow";

export interface RuntimeTask {
  name: string;
  command: string;
  description: string;
  source: RuntimeTaskSource;
  adapterName?: string;
}

export interface RuntimeFeatureState {
  spec: FeatureSpec;
  enabled: boolean;
  configured: boolean;
  configuredValue?: boolean;
}

export interface CreateHarnessRuntimeOptions {
  cwd?: string;
  requireProjectConfig?: boolean;
}

export interface BuildContextOptions {
  tagStyle?: TagStyle;
  includeSkills?: boolean;
  includeCustomRules?: boolean;
}

export interface WriteContextOptions extends BuildContextOptions {
  outputPath: string;
}

export class HarnessRuntime {
  readonly cwd: string;
  readonly hasProjectConfig: boolean;
  readonly hasAnyConfig: boolean;
  readonly config?: HarnessConfig;
  readonly adapter: ProjectAdapter | null;
  readonly agentRegistry: AgentRegistry;
  readonly featureRegistry: FeatureRegistry;

  private readonly hookDispatcher: HookDispatcher;
  private readonly auditLogger: AuditLogger;

  private constructor(args: {
    cwd: string;
    hasProjectConfig: boolean;
    hasAnyConfig: boolean;
    config?: HarnessConfig;
    adapter: ProjectAdapter | null;
    hookDispatcher: HookDispatcher;
    auditLogger: AuditLogger;
    featureRegistry: FeatureRegistry;
  }) {
    this.cwd = args.cwd;
    this.hasProjectConfig = args.hasProjectConfig;
    this.hasAnyConfig = args.hasAnyConfig;
    this.config = args.config;
    this.adapter = args.adapter;
    this.hookDispatcher = args.hookDispatcher;
    this.auditLogger = args.auditLogger;
    this.featureRegistry = args.featureRegistry;
    this.agentRegistry = new AgentRegistry(args.config?.agents.definitions ?? []);
  }

  static async create(opts?: CreateHarnessRuntimeOptions): Promise<HarnessRuntime> {
    const cwd = opts?.cwd ?? process.cwd();
    const hasProjectConfig = projectConfigExists(cwd);
    const hasAnyConfig = anyConfigExists(cwd);

    if (opts?.requireProjectConfig && !hasProjectConfig) {
      throw new Error("No harness project configuration found. Run `agent-harness setup` first.");
    }

    const config = hasProjectConfig ? await loadConfig({ cwd }) : undefined;
    const adapter = await detectProjectType(cwd);
    const handlers = hasProjectConfig ? await discoverHooks(cwd) : [];
    const featureRegistry = buildFeatureRegistry(config);

    return new HarnessRuntime({
      cwd,
      hasProjectConfig,
      hasAnyConfig,
      config,
      adapter,
      hookDispatcher: new HookDispatcher(handlers),
      auditLogger: new AuditLogger(cwd),
      featureRegistry,
    });
  }

  listTasks(): RuntimeTask[] {
    const tasks = new Map<string, RuntimeTask>();

    if (this.adapter) {
      for (const command of this.adapter.getCommands()) {
        tasks.set(command.name, toRuntimeTask(command, "adapter", this.adapter.name));
      }
    }

    if (this.config) {
      for (const [name, command] of Object.entries(this.config.workflows.commands)) {
        tasks.set(name, {
          name,
          command,
          description: `Workflow command "${name}"`,
          source: "workflow",
        });
      }
    }

    return [...tasks.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  getTask(name: string): RuntimeTask | undefined {
    return this.listTasks().find((task) => task.name === name);
  }

  listFeatureStates(): RuntimeFeatureState[] {
    const configuredFeatures = this.config?.features ?? {};

    return this.featureRegistry.list().map((spec) => ({
      spec,
      enabled: this.featureRegistry.isEnabled(spec.id),
      configured: Object.prototype.hasOwnProperty.call(configuredFeatures, spec.key),
      configuredValue: configuredFeatures[spec.key],
    }));
  }

  async dispatchHooks(
    event: HookEventName,
    data?: Record<string, unknown>,
  ): Promise<HookResult[]> {
    if (!this.hasProjectConfig || !this.hookDispatcher.hasHandlers(event)) {
      return [];
    }

    const results = await this.hookDispatcher.dispatch(event, this.cwd, data);
    await this.log("hook.executed", `Executed ${results.length} hook(s) for ${event}`, {
      event,
      results: results.map((result) => ({
        command: result.handler.command,
        exitCode: result.exitCode,
        durationMs: result.durationMs,
      })),
    });
    return results;
  }

  async log(
    kind: AuditEventKind,
    message: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.hasProjectConfig && kind !== "setup") {
      return;
    }
    await this.auditLogger.log(kind, message, data);
  }

  async buildContext(
    opts?: BuildContextOptions,
  ): Promise<ContextPipelineResult> {
    const pipeline = new ContextPipeline();
    await pipeline.addHierarchicalDocs(this.cwd);

    if (this.config && (opts?.includeCustomRules ?? true)) {
      pipeline.addCustomRules(this.config.templates.agents_md.custom_rules);
    }

    if (this.config && (opts?.includeSkills ?? true)) {
      await pipeline.addSkillsSummary(this.config, this.cwd);
    }

    return pipeline.build({ tagStyle: opts?.tagStyle ?? "markdown" });
  }

  async writeContext(
    opts: WriteContextOptions,
  ): Promise<ContextPipelineResult> {
    const result = await this.buildContext(opts);
    const outputPath = resolve(this.cwd, opts.outputPath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, result.rendered + "\n", "utf-8");
    return result;
  }
}

function toRuntimeTask(
  command: CommandDefinition,
  source: RuntimeTaskSource,
  adapterName?: string,
): RuntimeTask {
  return {
    name: command.name,
    command: command.command,
    description: command.description,
    source,
    adapterName,
  };
}

function buildFeatureRegistry(config?: HarnessConfig): FeatureRegistry {
  const registry = new FeatureRegistry();
  const configured = config?.features ?? {};

  for (const key of Object.keys(configured)) {
    registry.register({
      id: key,
      key,
      stage: "experimental",
      defaultEnabled: false,
      description: `Feature flag configured via "${key}"`,
    });
  }

  registry.applyOverrides(configured);
  return registry;
}
