export type FeatureStage = "stable" | "experimental" | "deprecated" | "removed";

export interface FeatureSpec {
  id: string;
  key: string;
  stage: FeatureStage;
  defaultEnabled: boolean;
  description: string;
}
