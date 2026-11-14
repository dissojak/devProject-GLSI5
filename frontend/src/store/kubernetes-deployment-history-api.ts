
import {
  apiSlice,
} from "@/store/api";

export type KubernetesAttemptStatus =
  | "STARTED"
  | "APPLIED"
  | "FAILED";

export interface KubernetesDeploymentAttempt {
  id: string;
  project: string;
  plan: string;
  planVersion: number;
  triggeredBy: string;
  cluster: string;
  namespace: string;
  status: KubernetesAttemptStatus;
  output?: string;
  errorMessage?: string;
  startedAt: string;
  finishedAt?: string;
  createdAt: string;
}

export interface DeploymentHistoryParams {
  projectId: string;
  planId: string;
  page: number;
  limit?: number;
}

export interface DeploymentHistoryResponse {
  message: string;
  data: KubernetesDeploymentAttempt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
}

export const kubernetesDeploymentHistoryApi =
  apiSlice.injectEndpoints({
    endpoints: (build) => ({
      listKubernetesDeploymentHistory: build.query<
        DeploymentHistoryResponse,
        DeploymentHistoryParams
      >({
        query: ({
          projectId,
          planId,
          page,
          limit = 10,
        }) => ({
          url:
            `/projects/${projectId}/plans/${planId}` +
            `/deployments/history`,
          method: "GET",
          params: {
            page,
            limit,
          },
        }),

        providesTags: (_result, _error, { planId }) => [
          {
            type: "DeploymentPlans",
            id: `${planId}-deployment-history`,
          },
        ],
      }),
    }),
  });

export const {
  useListKubernetesDeploymentHistoryQuery,
} = kubernetesDeploymentHistoryApi;
