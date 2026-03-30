export const HARNESS_MANIFEST_VERSION = 1 as const;

export interface HarnessManifestToolpackEntry {
  id: string;
  packSource: string;
  packVersion: string;
  /** `official` | `community` (Phase 4). */
  provenance?: string;
  /** Optional verification hint from the toolpack plugin. */
  verificationHint?: string;
  /** True when the pack declares org shared policy (Phase 6). */
  sharedPolicy?: boolean;
}

export interface HarnessManifestVerificationCheck {
  name: string;
  /** Shell command from workflows.commands (empty if missing). */
  command: string;
}

/** Adoption-style counts for CI and team review (Phase 5 / ROI-02). */
export interface HarnessManifestAdoption {
  toolsEnabled: number;
  toolpacksEnabled: number;
  officialToolpacksEnabled: number;
  skillsDiscovered: number;
  verificationChecksConfigured: number;
}

/**
 * Health snapshot from last verify + declared scaffold coverage (Phase 5 / ROI-02, M3).
 */
/** Cross-repo correlation (optional). Phase 6 / ORG-02. */
export interface HarnessManifestAggregation {
  org?: string;
  repo_slug?: string;
}

/** Approved exception for aggregation / policy tooling. Phase 6 / ORG-03. */
export interface HarnessManifestApprovedException {
  id: string;
  description?: string;
  target?: string;
}

export interface HarnessManifestHealth {
  /** From `.harness/state/last-verify.json` when present. */
  lastVerifyAt?: string;
  lastVerifyOk?: boolean;
  /** Fractional days since last verify, or null if no state. */
  daysSinceLastVerify: number | null;
  /** Paths listed in `generated_files` in config. */
  generatedFilesTracked: number;
  /** Subset of tracked paths that exist on disk under `cwd`. */
  generatedFilesPresentOnDisk: number;
  /** `present / tracked` when tracked > 0; `1` when tracked === 0. */
  artifactCoverageRatio: number;
}

export interface HarnessManifest {
  manifestVersion: typeof HARNESS_MANIFEST_VERSION;
  generatedAt: string;
  harnessCliVersion: string;
  project: {
    name: string;
    type: string;
    language: string;
    framework?: string;
  };
  tools: string[];
  toolpacks: HarnessManifestToolpackEntry[];
  skills: {
    count: number;
    ids: string[];
  };
  verification: {
    checks: HarnessManifestVerificationCheck[];
  };
  generatedFilesCount: number;
  adoption: HarnessManifestAdoption;
  health: HarnessManifestHealth;
  /** Present when config sets `aggregation`. */
  aggregation?: HarnessManifestAggregation;
  /** Present when config lists `approved_exceptions`. */
  approved_exceptions?: HarnessManifestApprovedException[];
}
