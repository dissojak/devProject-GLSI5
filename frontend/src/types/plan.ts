import type { ApiListPagination, ProjectEnvironment } from "@/types/project";

export type PlanStatus = "DRAFT" | "APPROVED" | "REJECTED" | "SUPERSEDED";

export type PlanComponentType = "FRONTEND" | "BACKEND" | "DATABASE" | "WORKER" | "OTHER";

export interface PlanResourceSpec {
  requests: { cpu: string; memory: string };
  limits: { cpu: string; memory: string };
}

export interface PlanHpaSpec {
  enabled: boolean;
  minReplicas?: number | null;
  maxReplicas?: number | null;
  targetCpuUtilizationPercent?: number | null;
  targetMemoryUtilizationPercent?: number | null;
}

export interface PlanIngressSpec {
  enabled: boolean;
  host?: string | null;
  path?: string | null;
  tls: boolean;
}

export interface PlanComponent {
  name: string;
  type: PlanComponentType;
  containerPort: number;
  image?: string | null;
  replicas: number;
  resources: PlanResourceSpec;
  hpa: PlanHpaSpec;
  ingress: PlanIngressSpec;
}

export interface PlanReview {
  decidedBy: string;
  decidedAt: string;
  reason?: string | null;
}

export interface DeploymentPlan {
  id: string;
  project: string;
  analysis: string;
  version: number;
  previousPlan?: string | null;
  status: PlanStatus;
  components: PlanComponent[];
  recommendations: string[];
  createdBy: string;
  review?: PlanReview | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanListResponse {
  message: string;
  data: DeploymentPlan[];
  pagination: ApiListPagination;
}

export interface PlanResponse {
  message: string;
  data: DeploymentPlan;
}

export interface RejectPlanBody {
  reason: string;
}

export interface DeployPlanBody {
  environment: ProjectEnvironment;
}
