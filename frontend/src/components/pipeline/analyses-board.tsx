"use client";

import { useCallback, useMemo, useState } from "react";

import { AnalysesTable } from "@/components/pipeline/analyses-table";
import { PipelineEmpty } from "@/components/pipeline/pipeline-empty";
import { PipelineError } from "@/components/pipeline/pipeline-error";
import { PipelineFilterStrip } from "@/components/pipeline/pipeline-filter-strip";
import { PipelinePagination } from "@/components/pipeline/pipeline-pagination";
import { PipelineSkeleton } from "@/components/pipeline/pipeline-skeleton";
import { PipelineStageHeader } from "@/components/pipeline/pipeline-stage-header";
import { useToast } from "@/components/toast/toast-provider";
import {
  ANALYSES_EMPTY_ROW,
  ANALYSES_ERROR_ROW,
  ANALYSES_FILTER_ROWS,
  ANALYSES_STAGE_ROW,
  ANALYSES_TOAST_ROWS,
} from "@/data/analyses-board";
import { PIPELINE_FILTER_ALL_ID, PIPELINE_FILTER_EMPTY_NOTE, PIPELINE_SYNCING_NOTE } from "@/data/pipeline-boards";
import { PROJECTS_ROUTE } from "@/data/dashboard";
import { AUTH_LOGIN_ROUTE } from "@/data/navigation";
import { useAnalysisActions, useAnalysesBoard } from "@/hooks/use-analyses-board";
import { useAuthGate } from "@/hooks/use-session-guard";
import { useProjectNames } from "@/hooks/use-project-names";
import { pipelineFilterRows, pipelineStatusCounts } from "@/utils/pipeline-view";
import type { Analysis } from "@/types/analysis";

const statusOf = (row: Analysis) => row.status;

/**
 * Stage 01 · Evidence. Gate → skeleton → error/empty sheet → strip + table.
 * Rows poll every 5s; the strip tallies the loaded page client-side.
 * The Draft plan action hands a COMPLETED row to Stage 02 (the planner).
 */
export function AnalysesBoard() {
  const gate = useAuthGate(AUTH_LOGIN_ROUTE.href);
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState(PIPELINE_FILTER_ALL_ID);
  const [busyId, setBusyId] = useState<string | null>(null);
  const board = useAnalysesBoard(page);
  const actions = useAnalysisActions();
  const projectNames = useProjectNames();

  const rows = useMemo(() => board.data?.data ?? [], [board.data]);
  const counts = useMemo(() => pipelineStatusCounts(rows, statusOf), [rows]);
  const visibleRows = useMemo(
    () => pipelineFilterRows(rows, filter, statusOf),
    [rows, filter],
  );

  const draft = useCallback(
    async (projectId: string, analysisId: string) => {
      setBusyId(analysisId);
      try {
        const failure = await actions.draft(projectId, analysisId);
        if (failure === null) {
          toast.push(ANALYSES_TOAST_ROWS.drafted);
        } else {
          toast.push({
            tone: ANALYSES_TOAST_ROWS.failed.tone,
            title: ANALYSES_TOAST_ROWS.failed.title,
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
      <PipelineStageHeader row={ANALYSES_STAGE_ROW} />
      {board.error ? (
        <PipelineError row={ANALYSES_ERROR_ROW} detail={board.error} onRetry={board.refetch} />
      ) : rows.length === 0 ? (
        <PipelineEmpty row={ANALYSES_EMPTY_ROW} href={PROJECTS_ROUTE.href} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PipelineFilterStrip
              rows={ANALYSES_FILTER_ROWS}
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
            <AnalysesTable
              rows={visibleRows}
              projectNames={projectNames}
              busyId={busyId}
              onDraft={draft}
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
