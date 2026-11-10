import type { ApiListPagination, ProjectEnvironment } from "@/types/project";

export type DeploymentStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

export type ArgoSyncStatus = "SYNCED" | "OUT_OF_SYNC" | "UNKNOWN";

export type ArgoHealthStatus =
  | "HEALTHY"
  | "PROGRESSING"
  | "DEGRADED"
  | "SUSPENDED"
  | "MISSING"
  | "UNKNOWN";

export interface DeploymentGitops {
  repositoryUrl: string;
  branch: string;
  path: string;
  commitSha?: string | null;
}

export interface DeploymentArgo {
  applicationName?: string | null;
  syncStatus?: ArgoSyncStatus | null;
  healthStatus?: ArgoHealthStatus | null;
  lastSyncedAt?: string | null;
}

export interface DeploymentError {
  code: string;
  message: string;
}

export interface Deployment {
  id: string;
  project: string;
  plan: string;
  planVersion: number;
  environment: ProjectEnvironment;
  triggeredBy: string;
  status: DeploymentStatus;
  gitops: DeploymentGitops;
  argo: DeploymentArgo;
  error?: DeploymentError | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentListResponse {
  message: string;
  data: Deployment[];
  pagination: ApiListPagination;
}

export interface DeploymentResponse {
  message: string;
  data: Deployment;
}
