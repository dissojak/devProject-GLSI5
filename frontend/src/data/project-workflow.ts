import type { AnalysisViewId } from "@/types/analysis";
import type {
  ProjectRequirement,
  ProjectStepId,
  ProjectPhaseId,
  ProjectStepRule,
  WorkflowPhase,
  WorkflowStepDefinition,
} from "@/types/workflow";

export const PROJECT_WORKFLOW_STEPS: WorkflowStepDefinition<ProjectStepId>[] = [
  { id: "repository", number: "01", label: "GitHub repository", description: "Connect and verify the repository" },
  { id: "analysis", number: "02", label: "Repository analysis", description: "Technologies, components and evidence" },
  { id: "docker", number: "03", label: "Docker preparation", description: "Detect, review or generate Dockerfiles" },
  { id: "recommendations", number: "03b", label: "Recommendations", description: "Review, accept or reject the suggested fixes" },
  { id: "plan", number: "04", label: "Deployment plan", description: "Generate, edit and approve the plan" },
  { id: "cicd", number: "05", label: "CI/CD build", description: "GitHub Actions builds and publishes the GHCR image" },
  { id: "manifests", number: "06", label: "Kubernetes manifests", description: "Generate and validate the YAML files" },
  { id: "server-validation", number: "07", label: "Server validation", description: "Dry run against the Minikube API" },
  { id: "deploy", number: "08", label: "Deploy", description: "Apply the manifests to Minikube" },
  { id: "monitoring", number: "09", label: "Monitoring", description: "Check Pods, Services and availability" },
  { id: "history", number: "10", label: "History", description: "Past attempts and their results" },
];

export const PROJECT_STEP_RULES: ProjectStepRule[] = [
  { id: "repository", completeWhen: "verifiedRepository" },
  { id: "analysis", requires: "verifiedRepository", completeWhen: "completedAnalysis" },
  { id: "docker", requires: "completedAnalysis", completeWhen: "dockerReady" },
  { id: "recommendations", requires: "completedAnalysis", completeWhen: "reviewedRecommendations" },
  { id: "plan", requires: "completedAnalysis", completeWhen: "approvedPlan" },
  { id: "cicd", requires: "approvedPlan", completeWhen: "imagesPublished" },
  { id: "manifests", requires: "approvedPlan", completeWhen: "validManifests" },
  { id: "server-validation", requires: "validManifests", completeWhen: "deployed" },
  { id: "deploy", requires: "validManifests", completeWhen: "deployed" },
  { id: "monitoring", requires: "approvedPlan", completeWhen: "healthy" },
  { id: "history", requires: "approvedPlan", completeWhen: "deployed" },
];

export const PROJECT_LOCK_REASONS: Record<ProjectRequirement, string> = {
  verifiedRepository: "Connect and verify the GitHub repository in step 01 to unlock this step.",
  completedAnalysis: "Run a repository analysis in step 02 and wait for it to complete.",
  reviewedRecommendations: "Review the recommendations in step 03b to unlock this step.",
  dockerReady: "Add or save a Dockerfile in step 03 to unlock this step.",
  approvedPlan: "Approve the deployment plan in step 04 to unlock this step.",
  imagesPublished: "Build and publish the Docker images in step 05 to unlock this step.",
  deployed: "Deploy the manifests in step 08 to unlock this step.",
  healthy: "Wait until every component is healthy in step 09.",
  validManifests: "Generate and validate the Kubernetes manifests in step 06 to unlock this step.",
};

export const ANALYSIS_VIEWS: { id: AnalysisViewId; label: string }[] = [
  { id: "results", label: "Results" },
  { id: "history", label: "History" },
];

export const PROJECT_PHASES: WorkflowPhase<ProjectStepId, ProjectPhaseId>[] = [
  { id: "analyse", label: "Analyse", stepIds: ["repository", "analysis", "docker"] },
  { id: "recommendations", label: "Recommendations", stepIds: ["recommendations"] },
  { id: "build", label: "Build", stepIds: ["plan", "cicd"] },
  { id: "kubernetes", label: "Kubernetes", stepIds: ["manifests", "server-validation", "deploy"] },
  { id: "operate", label: "Operate", stepIds: ["monitoring", "history"] },
];

export const PROJECT_STEP_PARAM = "step";
