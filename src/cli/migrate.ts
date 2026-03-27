import { getMigrationPlan, listRegisteredFromVersions } from "../migrate/registry.js";

export interface MigrateCliOptions {
  fromVersion: string;
  apply?: boolean;
  cwd?: string;
}

export async function runMigrate(opts: MigrateCliOptions): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const plan = getMigrationPlan(opts.fromVersion);

  if (!plan) {
    console.error(`migrate: no migration registered for "${opts.fromVersion}".`);
    console.error(`Registered from-versions: ${listRegisteredFromVersions().join(", ") || "(none)"}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Migration plan: ${opts.fromVersion} → current`);
  console.log("");

  for (const p of plan.patches) {
    console.log(`  [${p.id}] ${p.description}`);
    console.log(`           safe=${p.safe}`);
    console.log("");
  }

  if (!opts.apply) {
    console.log("Dry run only. Re-run with --apply to execute patches.");
    return;
  }

  for (const p of plan.patches) {
    await Promise.resolve(p.apply(cwd));
    console.log(`Applied: ${p.id}`);
  }

  console.log("\nDone. Consider running `harn update` and `harn manifest`.");
}
