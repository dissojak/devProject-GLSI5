"use client";

import { useCallback, useMemo, useState } from "react";

import { DeploymentsTable } from "@/components/pipeline/deployments-table";
import { PipelineEmpty } from "@/components/pipeline/pipeline-empty";
import { PipelineError } from "@/components/pipeline/pipeline-error";
import { PipelineFilterStrip } from "@/components/pipeline/pipeline-filter-strip";
import { PipelinePagination } from "@/components/pipeline/pipeline-pagination";
import { PipelineSkeleton } from "@/components/pipeline/pipeline-skeleton";
import { PipelineStageHeader } from "@/components/pipeline/pipeline-stage-header";
import {
  DEPLOYMENTS_EMPTY_ROW,
  DEPLOYMENTS_ERROR_ROW,
  DEPLOYMENTS_FILTER_ROWS,
  DEPLOYMENTS_STAGE_ROW,
  DEPLOYMENT_TOAST_ROWS,
} from "@/data/deployments-board";
import { PIPELINE_FILTER_ALL_ID, PIPELINE_FILTER_EMPTY_NOTE, PIPELINE_SYNCING_NOTE } from "@/data/pipeline-boards";
import { PLANS_ROUTE } from "@/data/dashboard";
import { AUTH_LOGIN_ROUTE } from "@/data/navigation";
import { useDeploymentActions, useDeploymentsBoard } from "@/hooks/use-deployments-board";
import { useAuthGate } from "@/hooks/use-session-guard";
import { useProjectNames } from "@/hooks/use-project-names";
import { useToast } from "@/components/toast/toast-provider";
import { pipelineFilterRows, pipelineStatusCounts } from "@/utils/pipeline-view";
import type { Deployment } from "@/types/deployment";

const statusOf = (row: Deployment) => row.status;

/**
 * Stage 03 · Rollout. Live statuses pulse; cancels confirm nothing — the
 * window is short (pending/in-progress) and the action is reversible-ish
 * in the cluster view. Results toast.
 */
export function DeploymentsBoard() {
  const gate = useAuthGate(AUTH_LOGIN_ROUTE.href);
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState(PIPELINE_FILTER_ALL_ID);
  const [busyId, setBusyId] = useState<string | null>(null);
  const board = useDeploymentsBoard(page);
  const actions = useDeploymentActions();
  const projectNames = useProjectNames();

  const rows = useMemo(() => board.data?.data ?? [], [board.data]);
  const counts = useMemo(() => pipelineStatusCounts(rows, statusOf), [rows]);
  const visibleRows = useMemo(
    () => pipelineFilterRows(rows, filter, statusOf),
    [rows, filter],
  );

  const cancel = useCallback(
    async (deploymentId: string) => {
      setBusyId(deploymentId);
      try {
        const failure = await actions.cancel(deploymentId);
        if (failure === null) {
          toast.push(DEPLOYMENT_TOAST_ROWS.cancelled);
        } else {
          toast.push({
            tone: DEPLOYMENT_TOAST_ROWS.failed.tone,
            title: DEPLOYMENT_TOAST_ROWS.failed.title,
            message: failure,
          });
        }
      } finally {
        setBusyId(null);
      }
    },
    [actions, toast],
  );

  if (gate !== "granted" || board.loading) {
    return <PipelineSkeleton />;
  }

  return (
    <section className="space-y-5">
      <PipelineStageHeader row={DEPLOYMENTS_STAGE_ROW} />
      {board.error ? (
        <PipelineError row={DEPLOYMENTS_ERROR_ROW} detail={board.error} onRetry={board.refetch} />
      ) : rows.length === 0 ? (
        <PipelineEmpty row={DEPLOYMENTS_EMPTY_ROW} href={PLANS_ROUTE.href} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PipelineFilterStrip
              rows={DEPLOYMENTS_FILTER_ROWS}
              counts={counts}
              activeId={filter}
              onSelect={setFilter}
            />
            {board.refetching ? (
              <p className="font-mono text-label-sm text-cinder" aria-live="polite">
                {PIPELINE_SYNCING_NOTE}
              </p>
            ) : null}
          </div>
          {visibleRows.length > 0 ? (
            <DeploymentsTable
              rows={visibleRows}
              projectNames={projectNames}
              busyId={busyId}
              onCancel={(deploymentId) => void cancel(deploymentId)}
            />
          ) : (
            <p className="rounded-2xl border border-steel/50 bg-panel/40 px-6 py-10 text-center font-mono text-label-sm text-mist">
              {PIPELINE_FILTER_EMPTY_NOTE}
            </p>
          )}
          {board.data?.pagination ? (
            <PipelinePagination pagination={board.data.pagination} onPage={setPage} />
          ) : null}
        </>
      )}
    </section>
  );
}
