import type { AnalysisStatus } from "@/types/analysis";
import type {
  PipelineColumnRow,
  PipelineEmptyRow,
  PipelineErrorRow,
  PipelineFilterRow,
  PipelineLoadingRow,
  PipelineStageRow,
  StatusChipRow,
} from "@/types/pipeline-board";

export const ANALYSES_STAGE_ROW: PipelineStageRow = {
  stage: "Stage 01",
  kind: "Evidence",
  title: "Analyses",
  subtitle: "Every repository scan you have requested, across all projects.",
};

export const ANALYSES_FILTER_ROWS: PipelineFilterRow[] = [
  { id: "all", label: "All" },
  { id: "RUNNING", label: "Running" },
  { id: "PENDING", label: "Pending" },
  { id: "COMPLETED", label: "Completed" },
  { id: "FAILED", label: "Failed" },
];

export const ANALYSIS_STATUS_CHIPS: Record<AnalysisStatus, StatusChipRow> = {
  PENDING: { label: "PENDING", classes: "border-champagne/40 bg-champagne/10 text-champagne" },
  RUNNING: { label: "RUNNING", classes: "border-ice/40 bg-ice/10 text-ice" },
  COMPLETED: { label: "COMPLETED", classes: "border-mint/40 bg-mint/10 text-mint" },
  FAILED: { label: "FAILED", classes: "border-crimson/40 bg-crimson/10 text-crimson" },
};

export const ANALYSES_TABLE_COLUMNS: PipelineColumnRow[] = [
  { id: "number", label: "#" },
  { id: "project", label: "Project" },
  { id: "status", label: "Status" },
  { id: "branch", label: "Branch" },
  { id: "technologies", label: "Technologies" },
  { id: "duration", label: "Duration" },
  { id: "started", label: "Started" },
];

export const ANALYSES_TECH_PREVIEW_COUNT = 3;

/** Rows whose status still advances on its own get the live pulse dot. */
export const ANALYSIS_LIVE_STATUS: Record<AnalysisStatus, boolean> = {
  PENDING: true,
  RUNNING: true,
  COMPLETED: false,
  FAILED: false,
};

export const ANALYSES_EMPTY_ROW: PipelineEmptyRow = {
  icon: "analytics",
  heading: "No analyses yet",
  copy: "Open a project with a connected repository and request the first scan.",
  actionLabel: "Go to projects",
};

export const ANALYSES_ERROR_ROW: PipelineErrorRow = {
  icon: "warning",
  heading: "Analyses unreachable",
  copy: "We could not load your analyses. Check your connection and try again.",
  actionLabel: "Try again",
};

export const ANALYSES_LOADING_ROW: PipelineLoadingRow = {
  icon: "radar",
  heading: "Reading the analysis board",
  copy: "Pulling your latest scans from the planner core.",
};
