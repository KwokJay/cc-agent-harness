export const HARNESS_MANIFEST_VERSION = 1 as const;

export interface HarnessManifestToolpackEntry {
  id: string;
  packSource: string;
  packVersion: string;
}

export interface HarnessManifestVerificationCheck {
  name: string;
  /** Shell command from workflows.commands (empty if missing). */
  command: string;
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
}
