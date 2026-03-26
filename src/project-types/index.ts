import type { ProjectTypeAdapter, ProjectTypeId, DetectedProject } from "./types.js";
import { FrontendAdapter } from "./frontend.js";
import { BackendAdapter } from "./backend.js";
import { FullstackAdapter } from "./fullstack.js";
import { MonorepoAdapter } from "./monorepo.js";
import { DocsAdapter } from "./docs.js";
import { scanWorkspace, getWorkspacePackageDirs } from "./scanner.js";

export type { ProjectTypeAdapter, ProjectTypeId, DetectedProject, SubProject, WorkflowCommands } from "./types.js";

const ALL_ADAPTERS: ProjectTypeAdapter[] = [
  new MonorepoAdapter(),
  new FullstackAdapter(),
  new FrontendAdapter(),
  new BackendAdapter(),
  new DocsAdapter(),
];

export const ALL_PROJECT_TYPE_IDS: ProjectTypeId[] = ALL_ADAPTERS.map((a) => a.id);

export function getProjectAdapter(id: ProjectTypeId): ProjectTypeAdapter {
  const adapter = ALL_ADAPTERS.find((a) => a.id === id);
  if (!adapter) throw new Error(`Unknown project type: ${id}`);
  return adapter;
}

export function detectProjectType(cwd: string): DetectedProject {
  return scanWorkspace(cwd);
}

export { getWorkspacePackageDirs };
