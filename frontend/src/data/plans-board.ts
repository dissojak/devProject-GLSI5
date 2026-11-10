import type { ProjectEnvironment } from "@/types/project";
import type {
  PlanComponentType,
  PlanStatus,
} from "@/types/plan";
import type {
  PipelineColumnRow,
  PipelineEmptyRow,
  PipelineErrorRow,
  PipelineFilterRow,
  PipelineLoadingRow,
  PipelineStageRow,
  StatusChipRow,
} from "@/types/pipeline-board";
import type { MaterialIconName } from "@/types/icons";

export const PLANS_STAGE_ROW: PipelineStageRow = {
  stage: "Stage 02",
  kind: "Contract",
  title: "Deployment plans",
  subtitle: "The container contracts drafted from your analyses. Approve, revise, or roll them out.",
};

export const PLANS_FILTER_ROWS: PipelineFilterRow[] = [
  { id: "all", label: "All" },
  { id: "DRAFT", label: "Draft" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
  { id: "SUPERSEDED", label: "Superseded" },
];

export const PLAN_STATUS_CHIPS: Record<PlanStatus, StatusChipRow> = {
  DRAFT: { label: "DRAFT", classes: "border-champagne/40 bg-champagne/10 text-champagne" },
  APPROVED: { label: "APPROVED", classes: "border-mint/40 bg-mint/10 text-mint" },
  REJECTED: { label: "REJECTED", classes: "border-crimson/40 bg-crimson/10 text-crimson" },
  SUPERSEDED: { label: "SUPERSEDED", classes: "border-mist/30 bg-mist/10 text-mist" },
};

export const PLAN_COMPONENT_TYPE_CHIPS: Record<PlanComponentType, StatusChipRow> = {
  FRONTEND: { label: "FRONTEND", classes: "border-ice/40 bg-ice/10 text-ice" },
  BACKEND: { label: "BACKEND", classes: "border-teal/40 bg-teal/10 text-teal" },
  DATABASE: { label: "DATABASE", classes: "border-champagne/40 bg-champagne/10 text-champagne" },
  WORKER: { label: "WORKER", classes: "border-lavender/40 bg-lavender/10 text-lavender" },
  OTHER: { label: "OTHER", classes: "border-mist/30 bg-mist/10 text-mist" },
};

export const PLANS_TABLE_COLUMNS: PipelineColumnRow[] = [
  { id: "version", label: "Version" },
  { id: "project", label: "Project" },
  { id: "status", label: "Status" },
  { id: "components", label: "Components" },
  { id: "created", label: "Created" },
];

export const PLAN_ACTION_LABELS: Record<"approve" | "reject" | "revise", string> = {
  approve: "Approve",
  reject: "Reject",
  revise: "New revision",
};

export const PLAN_ACTION_ICONS: Record<"approve" | "reject" | "revise", MaterialIconName> = {
  approve: "fact_check",
  reject: "block",
  revise: "edit",
};

export const PLAN_ACTION_VARIANTS: Record<
  "approve" | "reject" | "revise",
  "mint" | "crimson" | "champagne"
> = {
  approve: "mint",
  reject: "crimson",
  revise: "champagne",
};

/** Actions a plan offers per status; rendered via lookup, never a branch. */
export const PLAN_ACTION_ROWS: Record<PlanStatus, ("approve" | "reject" | "revise")[]> = {
  DRAFT: ["approve", "reject"],
  APPROVED: ["revise"],
  REJECTED: ["revise"],
  SUPERSEDED: [],
};

export const PLAN_DEPLOY_LEAD = "Deploy to";

export const PLAN_DEPLOY_TARGETS: { environment: ProjectEnvironment; label: string }[] = [
  { environment: "DEVELOPMENT", label: "Development" },
  { environment: "STAGING", label: "Staging" },
  { environment: "PRODUCTION", label: "Production" },
];

export const PLAN_REJECT_FORM_ROW = {
  label: "Rejection reason",
  placeholder: "Why is this plan rejected?",
  action: "Confirm rejection",
  cancel: "Cancel",
} as const;

export const PLAN_REVIEW_ROW = {
  awaiting: "Awaiting review",
  decidedLead: "Reviewed",
} as const;

export const PLAN_TOAST_ROWS = {
  approved: {
    tone: "mint",
    title: "Plan approved",
    message: "The contract is frozen. Deploy it when ready.",
  },
  rejected: {
    tone: "crimson",
    title: "Plan rejected",
    message: "Start a revision to rework the rejected draft.",
  },
  revised: {
    tone: "champagne",
    title: "Revision created",
    message: "A new draft picked up where this plan left off.",
  },
  deployed: {
    tone: "ice",
    title: "Deployment requested",
    message: "The rollout is queued. Track it on the deployments board.",
  },
  failed: {
    tone: "crimson",
    title: "Action failed",
    fallback: "The planner core did not complete the action. Try again.",
  },
} as const;

/** approve/revise succeed silently in the table; their toasts keyed by action. */
export const PLAN_ACTION_TOASTS: Record<"approve" | "revise", (typeof PLAN_TOAST_ROWS)["approved" | "revised"]> = {
  approve: PLAN_TOAST_ROWS.approved,
  revise: PLAN_TOAST_ROWS.revised,
};

export const PLAN_COMPONENT_LABELS = {
  port: "port",
  replicas: "replicas",
  hpa: "HPA",
  ingress: "Ingress",
  revisionOf: "rev of",
} as const;

export const PLANS_EMPTY_ROW: PipelineEmptyRow = {
  icon: "schema",
  heading: "No plans yet",
  copy: "Plans appear here once an analysis completes and the planner drafts one.",
  actionLabel: "Go to projects",
};

export const PLANS_ERROR_ROW: PipelineErrorRow = {
  icon: "warning",
  heading: "Plans unreachable",
  copy: "We could not load your deployment plans. Check your connection and try again.",
  actionLabel: "Try again",
};

export const PLANS_LOADING_ROW: PipelineLoadingRow = {
  icon: "radar",
  heading: "Reading the plan board",
  copy: "Pulling your deployment plans from the planner core.",
};
