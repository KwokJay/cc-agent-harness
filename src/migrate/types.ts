export interface MigratePatch {
  id: string;
  description: string;
  /** When false, --apply will refuse unless combined with --force (future). */
  safe: boolean;
  apply(cwd: string): void | Promise<void>;
}

export interface MigratePlanEntry {
  fromVersion: string;
  patches: MigratePatch[];
}
