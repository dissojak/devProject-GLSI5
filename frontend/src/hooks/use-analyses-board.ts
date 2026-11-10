import { useCallback, useMemo } from "react";

import { useListAllAnalysesQuery } from "@/store/analyses-api";
import { useDraftPlanMutation } from "@/store/plans-api";
import type { AnalysisListResponse } from "@/types/analysis";
import type { PipelineBoardState } from "@/types/pipeline-board";
import { apiErrorMessage } from "@/utils/api-error";
import { PIPELINE_PAGE_LIMIT } from "@/utils/pipeline-view";

export const ANALYSES_LOAD_FALLBACK = "Analyses could not be loaded.";

export const ANALYSES_SAVE_FALLBACK =
  "We could not reach the planner core. Check your connection and try again.";

/** Boards poll while mounted so live rows advance without a manual refresh. */
const BOARD_POLL_MS = 5000;

export function useAnalysesBoard(page: number): PipelineBoardState<AnalysisListResponse> {
  const query = useListAllAnalysesQuery(
    { page, limit: PIPELINE_PAGE_LIMIT },
    { pollingInterval: BOARD_POLL_MS, skipPollingIfUnfocused: true },
  );
  const refetch = useMemo(() => () => query.refetch(), [query]);

  return useMemo(
    () => ({
      data: query.data,
      loading: query.isLoading || (query.isFetching && query.data === undefined),
      refetching: query.isFetching && query.data !== undefined,
      error: query.isError ? apiErrorMessage(query.error, ANALYSES_LOAD_FALLBACK) : null,
      refetch,
    }),
    [query, refetch],
  );
}

export type AnalysisActionResult = string | null;

export interface AnalysisActions {
  /** Drafts the plan v1 from a COMPLETED analysis (Evidence → Contract). */
  draft: (projectId: string, analysisId: string) => Promise<AnalysisActionResult>;
  busy: boolean;
}

export function useAnalysisActions(): AnalysisActions {
  const [draftPlan, draftMeta] = useDraftPlanMutation();

  const draft = useCallback(
    async (projectId: string, analysisId: string) => {
      try {
        await draftPlan({ body: { projectId, analysisId } }).unwrap();

        return null;
      } catch (error) {
        return apiErrorMessage(error, ANALYSES_SAVE_FALLBACK);
      }
    },
    [draftPlan],
  );

  return { draft, busy: draftMeta.isLoading };
}
