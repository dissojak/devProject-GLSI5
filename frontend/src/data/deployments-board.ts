import type {
  ArgoHealthStatus,
  ArgoSyncStatus,
  DeploymentStatus,
} from "@/types/deployment";
import type { ProjectEnvironment } from "@/types/project";
import type {
  PipelineColumnRow,
  PipelineEmptyRow,
  PipelineErrorRow,
  PipelineFilterRow,
  PipelineLoadingRow,
  PipelineStageRow,
  StatusChipRow,
} from "@/types/pipeline-board";

export const DEPLOYMENTS_STAGE_ROW: PipelineStageRow = {
  stage: "Stage 03",
  kind: "Rollout",
  title: "Deployments",
  subtitle: "Every rollout of an approved plan, from gitops commit to cluster health.",
};

export const DEPLOYMENTS_FILTER_ROWS: PipelineFilterRow[] = [
  { id: "all", label: "All" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "PENDING", label: "Pending" },
  { id: "SUCCEEDED", label: "Succeeded" },
  { id: "FAILED", label: "Failed" },
  { id: "CANCELLED", label: "Cancelled" },
];

export const DEPLOYMENT_STATUS_CHIPS: Record<DeploymentStatus, StatusChipRow> = {
  PENDING: { label: "PENDING", classes: "border-champagne/40 bg-champagne/10 text-champagne" },
  IN_PROGRESS: { label: "IN PROGRESS", classes: "border-ice/40 bg-ice/10 text-ice" },
  SUCCEEDED: { label: "SUCCEEDED", classes: "border-mint/40 bg-mint/10 text-mint" },
  FAILED: { label: "FAILED", classes: "border-crimson/40 bg-crimson/10 text-crimson" },
  CANCELLED: { label: "CANCELLED", classes: "border-smoke/30 bg-smoke/10 text-smoke" },
};

/** Environment is the row's accent: left border + chip share the tone. */
export const DEPLOYMENT_ENVIRONMENT_CHIPS: Record<ProjectEnvironment, StatusChipRow> = {
  DEVELOPMENT: { label: "Development", classes: "text-teal border-teal/40 bg-teal/10" },
  STAGING: { label: "Staging", classes: "text-champagne border-champagne/40 bg-champagne/10" },
  PRODUCTION: { label: "Production", classes: "text-lavender border-lavender/40 bg-lavender/10" },
};

export const DEPLOYMENT_ENVIRONMENT_BORDERS: Record<ProjectEnvironment, string> = {
  DEVELOPMENT: "border-l-teal/70",
  STAGING: "border-l-champagne/70",
  PRODUCTION: "border-l-lavender/70",
};

export const ARGO_SYNC_CHIPS: Record<ArgoSyncStatus, StatusChipRow> = {
  SYNCED: { label: "SYNCED", classes: "border-mint/40 bg-mint/10 text-mint" },
  OUT_OF_SYNC: { label: "OUT OF SYNC", classes: "border-champagne/40 bg-champagne/10 text-champagne" },
  UNKNOWN: { label: "ARGO ?", classes: "border-mist/30 bg-mist/10 text-mist" },
};

export const ARGO_HEALTH_CHIPS: Record<ArgoHealthStatus, StatusChipRow> = {
  HEALTHY: { label: "HEALTHY", classes: "border-mint/40 bg-mint/10 text-mint" },
  PROGRESSING: { label: "PROGRESSING", classes: "border-ice/40 bg-ice/10 text-ice" },
  DEGRADED: { label: "DEGRADED", classes: "border-crimson/40 bg-crimson/10 text-crimson" },
  SUSPENDED: { label: "SUSPENDED", classes: "border-champagne/40 bg-champagne/10 text-champagne" },
  MISSING: { label: "MISSING", classes: "border-crimson/40 bg-crimson/10 text-crimson" },
  UNKNOWN: { label: "ARGO ?", classes: "border-mist/30 bg-mist/10 text-mist" },
};

/** Only rows the state machine can still cancel offer the action. */
export const DEPLOYMENT_CANCELLABLE: Record<DeploymentStatus, boolean> = {
  PENDING: true,
  IN_PROGRESS: true,
  SUCCEEDED: false,
  FAILED: false,
  CANCELLED: false,
};

export const DEPLOYMENT_CANCEL_LABEL = "Cancel deployment";

/** Rows whose status still advances on its own get the live pulse dot. */
export const DEPLOYMENT_LIVE_STATUS: Record<DeploymentStatus, boolean> = {
  PENDING: true,
  IN_PROGRESS: true,
  SUCCEEDED: false,
  FAILED: false,
  CANCELLED: false,
};

export const DEPLOYMENT_TOAST_ROWS = {
  cancelled: {
    tone: "champagne",
    title: "Deployment cancelled",
    message: "The rollout stopped before it reached the cluster.",
  },
  failed: {
    tone: "crimson",
    title: "Action failed",
    fallback: "The planner core did not complete the action. Try again.",
  },
} as const;

export const DEPLOYMENTS_TABLE_COLUMNS: PipelineColumnRow[] = [
  { id: "environment", label: "Environment" },
  { id: "project", label: "Project" },
  { id: "status", label: "Status" },
  { id: "plan", label: "Plan" },
  { id: "argo", label: "Argo" },
  { id: "duration", label: "Duration" },
  { id: "started", label: "Started" },
];

export const DEPLOYMENTS_EMPTY_ROW: PipelineEmptyRow = {
  icon: "alt_route",
  heading: "No deployments yet",
  copy: "Deploy an approved plan to roll it out to a cluster.",
  actionLabel: "Go to plans",
};

export const DEPLOYMENTS_ERROR_ROW: PipelineErrorRow = {
  icon: "warning",
  heading: "Deployments unreachable",
  copy: "We could not load your deployments. Check your connection and try again.",
  actionLabel: "Try again",
};

export const DEPLOYMENTS_LOADING_ROW: PipelineLoadingRow = {
  icon: "radar",
  heading: "Reading the deployment board",
  copy: "Pulling your rollouts from the planner core.",
};
