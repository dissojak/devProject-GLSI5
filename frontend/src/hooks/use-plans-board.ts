import { useCallback, useMemo } from "react";

import {
  useApprovePlanMutation,
  useDeployPlanMutation,
  useListPlansQuery,
  useRejectPlanMutation,
  useRevisePlanMutation,
} from "@/store/plans-api";
import type { DeployPlanBody, PlanListResponse, RejectPlanBody } from "@/types/plan";
import type { PipelineBoardState } from "@/types/pipeline-board";
import { apiErrorMessage } from "@/utils/api-error";
import { PIPELINE_PAGE_LIMIT } from "@/utils/pipeline-view";

export const PLANS_LOAD_FALLBACK = "Deployment plans could not be loaded.";

export const PLANS_SAVE_FALLBACK =
  "We could not reach the planner core. Check your connection and try again.";

const BOARD_POLL_MS = 5000;

export function usePlansBoard(page: number): PipelineBoardState<PlanListResponse> {
  const query = useListPlansQuery(
    { page, limit: PIPELINE_PAGE_LIMIT },
    { pollingInterval: BOARD_POLL_MS, skipPollingIfUnfocused: true },
  );
  const refetch = useMemo(() => () => query.refetch(), [query]);

  return useMemo(
    () => ({
      data: query.data,
      loading: query.isLoading || (query.isFetching && query.data === undefined),
      refetching: query.isFetching && query.data !== undefined,
      error: query.isError ? apiErrorMessage(query.error, PLANS_LOAD_FALLBACK) : null,
      refetch,
    }),
    [query, refetch],
  );
}

export type PlanActionResult = string | null;

export interface PlanActions {
  approve: (planId: string) => Promise<PlanActionResult>;
  reject: (planId: string, body: RejectPlanBody) => Promise<PlanActionResult>;
  revise: (planId: string) => Promise<PlanActionResult>;
  deploy: (planId: string, body: DeployPlanBody) => Promise<PlanActionResult>;
  busy: boolean;
}

export function usePlanActions(): PlanActions {
  const [approvePlan, approveMeta] = useApprovePlanMutation();
  const [rejectPlan, rejectMeta] = useRejectPlanMutation();
  const [revisePlan, reviseMeta] = useRevisePlanMutation();
  const [deployPlan, deployMeta] = useDeployPlanMutation();

  const approve = useCallback(
    async (planId: string) => {
      try {
        await approvePlan({ planId }).unwrap();

        return null;
      } catch (error) {
        return apiErrorMessage(error, PLANS_SAVE_FALLBACK);
      }
    },
    [approvePlan],
  );

  const reject = useCallback(
    async (planId: string, body: RejectPlanBody) => {
      try {
        await rejectPlan({ planId, body }).unwrap();

        return null;
      } catch (error) {
        return apiErrorMessage(error, PLANS_SAVE_FALLBACK);
      }
    },
    [rejectPlan],
  );

  const revise = useCallback(
    async (planId: string) => {
      try {
        await revisePlan({ planId }).unwrap();

        return null;
      } catch (error) {
        return apiErrorMessage(error, PLANS_SAVE_FALLBACK);
      }
    },
    [revisePlan],
  );

  const deploy = useCallback(
    async (planId: string, body: DeployPlanBody) => {
      try {
        await deployPlan({ planId, body }).unwrap();

        return null;
      } catch (error) {
        return apiErrorMessage(error, PLANS_SAVE_FALLBACK);
      }
    },
    [deployPlan],
  );

  const busy =
    approveMeta.isLoading || rejectMeta.isLoading || reviseMeta.isLoading || deployMeta.isLoading;

  return { approve, reject, revise, deploy, busy };
}
