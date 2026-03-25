export interface ContextBlock {
  tag: string;
  content: string;
  priority: number;
}

export type TagStyle = "xml" | "markdown" | "none";

export interface ContextBuildOptions {
  tagStyle?: TagStyle;
}

export interface ContextPipelineResult {
  blocks: ContextBlock[];
  rendered: string;
}
