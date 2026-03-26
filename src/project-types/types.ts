export type ProjectTypeId = "frontend" | "backend" | "fullstack" | "monorepo" | "docs";

export interface DetectedProject {
  type: ProjectTypeId;
  language: string;
  framework?: string;
  signals: string[];
  subProjects?: SubProject[];
}

export interface SubProject {
  path: string;
  name: string;
  type: ProjectTypeId;
  language: string;
  framework?: string;
  signals: string[];
}

export interface WorkflowCommands {
  [name: string]: string;
}

export interface ProjectTypeAdapter {
  id: ProjectTypeId;
  label: string;
  detect(cwd: string): DetectedProject | null;
  defaultCommands(detected: DetectedProject): WorkflowCommands;
  defaultVerificationChecks(): string[];
  defaultCustomRules(): string[];
}
