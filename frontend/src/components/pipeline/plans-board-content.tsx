"use client";

import { useCallback, useMemo, useState } from "react";

import { PlansTable } from "@/components/pipeline/plans-table";
import { PipelineEmpty } from "@/components/pipeline/pipeline-empty";
import { PipelineError } from "@/components/pipeline/pipeline-error";
import { PipelineFilterStrip } from "@/components/pipeline/pipeline-filter-strip";
import { PipelinePagination } from "@/components/pipeline/pipeline-pagination";
import { PipelineSkeleton } from "@/components/pipeline/pipeline-skeleton";
import { PipelineStageHeader } from "@/components/pipeline/pipeline-stage-header";
import {
  PLAN_ACTION_TOASTS,
  PLAN_TOAST_ROWS,
  PLANS_EMPTY_ROW,
  PLANS_ERROR_ROW,
  PLANS_FILTER_ROWS,
  PLANS_STAGE_ROW,
} from "@/data/plans-board";
import { PIPELINE_FILTER_ALL_ID, PIPELINE_FILTER_EMPTY_NOTE, PIPELINE_SYNCING_NOTE } from "@/data/pipeline-boards";
import { PROJECTS_ROUTE } from "@/data/dashboard";
import { usePlanActions, usePlansBoard } from "@/hooks/use-plans-board";
import { useProjectNames } from "@/hooks/use-project-names";
import { useToast } from "@/components/toast/toast-provider";
import { pipelineFilterRows, pipelineStatusCounts } from "@/utils/pipeline-view";
import type { PlanActionId } from "@/components/pipeline/plans-table";
import type { DeploymentPlan } from "@/types/plan";
import type { ProjectEnvironment } from "@/types/project";

const statusOf = (row: DeploymentPlan) => row.status;

/**
 * Stage 02 · Contract. The board owns every interaction state: which row is
 * expanded (spec sheet), which is mid-rejection (inline form) and which is
 * mid-action (busy). Mutations flow through usePlanActions; results toast.
 */
export function PlansBoardContent() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState(PIPELINE_FILTER_ALL_ID);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const board = usePlansBoard(page);
  const actions = usePlanActions();
  const projectNames = useProjectNames();

  const rows = useMemo(() => board.data?.data ?? [], [board.data]);
  const counts = useMemo(() => pipelineStatusCounts(rows, statusOf), [rows]);
  const visibleRows = useMemo(
    () => pipelineFilterRows(rows, filter, statusOf),
    [rows, filter],
  );

  const toggle = useCallback(
    (planId: string) => {
      setExpandedId((current) => (current === planId ? null : planId));
      setRejectingId(null);
    },
    [],
  );

  const runAction = useCallback(
    async (planId: string, action: PlanActionId) => {
      if (action === "reject") {
        setRejectingId(planId);

        return;
      }
      setBusyId(planId);
      try {
        const failure =
          action === "approve" ? await actions.approve(planId) : await actions.revise(planId);
        if (failure === null) {
          toast.push(PLAN_ACTION_TOASTS[action]);
        } else {
          toast.push({
            tone: PLAN_TOAST_ROWS.failed.tone,
            title: PLAN_TOAST_ROWS.failed.title,
            message: failure,
          });
        }
      } finally {
        setBusyId(null);
      }
    },
    [actions, toast],
  );

  const submitRejection = useCallback(
    async (planId: string, reason: string) => {
      setBusyId(planId);
      try {
        const failure = await actions.reject(planId, { reason });
        if (failure === null) {
          toast.push(PLAN_TOAST_ROWS.rejected);
          setRejectingId(null);
        } else {
          toast.push({
            tone: PLAN_TOAST_ROWS.failed.tone,
            title: PLAN_TOAST_ROWS.failed.title,
            message: failure,
          });
        }
      } finally {
        setBusyId(null);
      }
    },
    [actions, toast],
  );

  const deploy = useCallback(
    async (planId: string, environment: ProjectEnvironment) => {
      setBusyId(planId);
      try {
        const failure = await actions.deploy(planId, { environment });
        if (failure === null) {
          toast.push(PLAN_TOAST_ROWS.deployed);
        } else {
          toast.push({
            tone: PLAN_TOAST_ROWS.failed.tone,
            title: PLAN_TOAST_ROWS.failed.title,
            message: failure,
          });
        }
      } finally {
        setBusyId(null);
      }
    },
    [actions, toast],
  );

  if (board.loading) {
    return <PipelineSkeleton />;
  }

  return (
    <section className="space-y-5">
      <PipelineStageHeader row={PLANS_STAGE_ROW} />
      {board.error ? (
        <PipelineError row={PLANS_ERROR_ROW} detail={board.error} onRetry={board.refetch} />
      ) : rows.length === 0 ? (
        <PipelineEmpty row={PLANS_EMPTY_ROW} href={PROJECTS_ROUTE.href} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PipelineFilterStrip
              rows={PLANS_FILTER_ROWS}
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
            <PlansTable
              rows={visibleRows}
              projectNames={projectNames}
              expandedId={expandedId}
              rejectingId={rejectingId}
              busyId={busyId}
              onToggle={toggle}
              onAction={(planId, action) => void runAction(planId, action)}
              onRejectSubmit={(planId, reason) => void submitRejection(planId, reason)}
              onRejectCancel={() => setRejectingId(null)}
              onDeploy={(planId, environment) => void deploy(planId, environment)}
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
