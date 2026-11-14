import { apiSlice } from "@/store/api";
import type { DeploymentResponse } from "@/types/deployment";
import type {
  DeployPlanBody,
  DraftPlanBody,
  PlanListResponse,
  PlanResponse,
  RejectPlanBody,
} from "@/types/plan";

export const plansApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listPlans: build.query<PlanListResponse, { page: number; limit: number }>({
      query: ({ page, limit }) => ({ url: "/plans", params: { page, limit } }),
      providesTags: [{ type: "Plans", id: "ALL" }],
    }),
    draftPlan: build.mutation<PlanResponse, { body: DraftPlanBody }>({
      query: ({ body }) => ({ url: "/plans", method: "POST", body }),
      invalidatesTags: [{ type: "Plans", id: "ALL" }, "DeploymentPlans"],
    }),
    approvePlan: build.mutation<PlanResponse, { planId: string }>({
      query: ({ planId }) => ({ url: `/plans/${planId}/approve`, method: "POST" }),
      invalidatesTags: [
        { type: "Plans", id: "ALL" },
        "DeploymentPlans",
        { type: "Deployments", id: "ALL" },
      ],
    }),
    rejectPlan: build.mutation<PlanResponse, { planId: string; body: RejectPlanBody }>({
      query: ({ planId, body }) => ({
        url: `/plans/${planId}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Plans", id: "ALL" }, "DeploymentPlans"],
    }),
    revisePlan: build.mutation<PlanResponse, { planId: string }>({
      query: ({ planId }) => ({ url: `/plans/${planId}/revisions`, method: "POST" }),
      invalidatesTags: [{ type: "Plans", id: "ALL" }, "DeploymentPlans"],
    }),
    deployPlan: build.mutation<DeploymentResponse, { planId: string; body: DeployPlanBody }>({
      query: ({ planId, body }) => ({
        url: `/plans/${planId}/deployments`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Plans", id: "ALL" },
        "DeploymentPlans",
        { type: "Deployments", id: "ALL" },
      ],
    }),
  }),
});

export const {
  useListPlansQuery,
  useDraftPlanMutation,
  useApprovePlanMutation,
  useRejectPlanMutation,
  useRevisePlanMutation,
  useDeployPlanMutation,
} = plansApi;
