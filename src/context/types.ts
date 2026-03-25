export interface ContextBlock {
  tag: string;
  content: string;
  priority: number;
}

export interface ContextPipelineResult {
  blocks: ContextBlock[];
  rendered: string;
}
