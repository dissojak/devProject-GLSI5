import { useCallback, useMemo } from "react";

import { useCancelDeploymentMutation, useListDeploymentsQuery } from "@/store/deployments-api";
import type { DeploymentListResponse } from "@/types/deployment";
import type { PipelineBoardState } from "@/types/pipeline-board";
import { apiErrorMessage } from "@/utils/api-error";
import { PIPELINE_PAGE_LIMIT } from "@/utils/pipeline-view";

export const DEPLOYMENTS_LOAD_FALLBACK = "Deployments could not be loaded.";

export const DEPLOYMENTS_SAVE_FALLBACK =
  "The planner core did not complete the action. Try again.";

const BOARD_POLL_MS = 5000;

export function useDeploymentsBoard(
  page: number,
): PipelineBoardState<DeploymentListResponse> {
  const query = useListDeploymentsQuery(
    { page, limit: PIPELINE_PAGE_LIMIT },
    { pollingInterval: BOARD_POLL_MS, skipPollingIfUnfocused: true },
  );
  const refetch = useMemo(() => () => query.refetch(), [query]);

  return useMemo(
    () => ({
      data: query.data,
      loading: query.isLoading || (query.isFetching && query.data === undefined),
      refetching: query.isFetching && query.data !== undefined,
      error: query.isError ? apiErrorMessage(query.error, DEPLOYMENTS_LOAD_FALLBACK) : null,
      refetch,
    }),
    [query, refetch],
  );
}

export type DeploymentActionResult = string | null;

export interface DeploymentActions {
  cancel: (deploymentId: string) => Promise<DeploymentActionResult>;
  busy: boolean;
}

export function useDeploymentActions(): DeploymentActions {
  const [cancelDeployment, cancelMeta] = useCancelDeploymentMutation();

  const cancel = useCallback(
    async (deploymentId: string) => {
      try {
        await cancelDeployment({ deploymentId }).unwrap();

        return null;
      } catch (error) {
        return apiErrorMessage(error, DEPLOYMENTS_SAVE_FALLBACK);
      }
    },
    [cancelDeployment],
  );

  return { cancel, busy: cancelMeta.isLoading };
}
