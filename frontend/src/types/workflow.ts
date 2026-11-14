export type WorkflowStepState = "complete" | "available" | "locked";

export interface WorkflowStepDefinition<Id extends string = string> {
  id: Id;
  number: string;
  label: string;
  description: string;
}

export interface WorkflowStepView<Id extends string = string> extends WorkflowStepDefinition<Id> {
  state: WorkflowStepState;
  lockedReason?: string;
}

export type ProjectStepId =
  | "repository"
  | "analysis"
  | "recommendations"
  | "docker"
  | "plan"
  | "cicd"
  | "manifests"
  | "server-validation"
  | "deploy"
  | "monitoring"
  | "history";

export type ProjectRequirement =
  | "verifiedRepository"
  | "completedAnalysis"
  | "reviewedRecommendations"
  | "dockerReady"
  | "approvedPlan"
  | "validManifests";

export interface ProjectStepRule {
  id: ProjectStepId;
  requires?: ProjectRequirement;
  completeWhen?: ProjectRequirement;
}

export type WorkflowPhaseStatus = "done" | "locked" | "progress";

export type ProjectPhaseId = "analyse" | "recommendations" | "build" | "kubernetes" | "operate";

export interface WorkflowPhase<Id extends string = string, PhaseId extends string = string> {
  id: PhaseId;
  label: string;
  stepIds: readonly Id[];
}

export interface WorkflowNavigation<Id extends string = string> {
  id: Id;
  token: number;
}
