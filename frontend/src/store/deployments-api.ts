import { apiSlice } from "@/store/api";
import type { DeploymentListResponse, DeploymentResponse } from "@/types/deployment";

export const deploymentsApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listDeployments: build.query<DeploymentListResponse, { page: number; limit: number }>({
      query: ({ page, limit }) => ({ url: "/deployments", params: { page, limit } }),
      providesTags: [{ type: "Deployments", id: "ALL" }],
    }),
    cancelDeployment: build.mutation<DeploymentResponse, { deploymentId: string }>({
      query: ({ deploymentId }) => ({
        url: `/deployments/${deploymentId}/cancel`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Deployments", id: "ALL" }],
    }),
  }),
});

export const { useListDeploymentsQuery, useCancelDeploymentMutation } = deploymentsApi;
