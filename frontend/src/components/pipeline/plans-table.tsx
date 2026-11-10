"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

import { PipelineStatusChip } from "@/components/pipeline/pipeline-status-chip";
import {
  PLAN_ACTION_ICONS,
  PLAN_ACTION_LABELS,
  PLAN_ACTION_ROWS,
  PLAN_ACTION_VARIANTS,
  PLAN_COMPONENT_LABELS,
  PLAN_COMPONENT_TYPE_CHIPS,
  PLAN_DEPLOY_LEAD,
  PLAN_DEPLOY_TARGETS,
  PLAN_REJECT_FORM_ROW,
  PLAN_REVIEW_ROW,
  PLAN_STATUS_CHIPS,
  PLANS_TABLE_COLUMNS,
} from "@/data/plans-board";
import { PROJECTS_ROUTE } from "@/data/dashboard";
import { Button } from "@/shared/button";
import { MaterialIcon } from "@/shared/material-icon";
import { TextField } from "@/shared/text-field";
import { cn } from "@/utils/class-names";
import { pipelineProjectFallback } from "@/utils/pipeline-view";
import { relativeTime } from "@/utils/relative-time";
import type { PlanComponent, DeploymentPlan } from "@/types/plan";
import type { ProjectEnvironment } from "@/types/project";

/** approve/revise run at once; reject opens the inline reason form. */
export type PlanActionId = "approve" | "reject" | "revise";

interface PlansTableProps {
  rows: DeploymentPlan[];
  projectNames: Map<string, string>;
  expandedId: string | null;
  rejectingId: string | null;
  busyId: string | null;
  onToggle: (planId: string) => void;
  onAction: (planId: string, action: PlanActionId) => void;
  onRejectSubmit: (planId: string, reason: string) => void;
  onRejectCancel: () => void;
  onDeploy: (planId: string, environment: ProjectEnvironment) => void;
}

function PlanComponentCard({ component }: { component: PlanComponent }) {
  return (
    <div className="rounded-xl border border-steel/40 bg-surface-mid/60 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-code-md text-foam">{component.name}</span>
        <PipelineStatusChip chip={PLAN_COMPONENT_TYPE_CHIPS[component.type]} />
      </div>
      <p className="mt-1.5 font-mono text-label-sm text-mist">
        {PLAN_COMPONENT_LABELS.port} {component.containerPort} · {component.replicas}{" "}
        {PLAN_COMPONENT_LABELS.replicas} · {component.resources.requests.cpu}/
        {component.resources.limits.cpu} cpu · {component.resources.requests.memory}/
        {component.resources.limits.memory}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {component.hpa.enabled ? (
          <span className="rounded-full border border-champagne/40 bg-champagne/10 px-2 py-0.5 font-mono text-label-sm text-champagne">
            {PLAN_COMPONENT_LABELS.hpa} {component.hpa.minReplicas}–{component.hpa.maxReplicas} @{" "}
            {component.hpa.targetCpuUtilizationPercent}%
          </span>
        ) : null}
        {component.ingress.enabled ? (
          <span className="rounded-full border border-ice/40 bg-ice/10 px-2 py-0.5 font-mono text-label-sm text-ice">
            {PLAN_COMPONENT_LABELS.ingress} {component.ingress.host}
            {component.ingress.tls ? " · TLS" : ""}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** The reason lives in the form until submit; the board receives it whole. */
function PlanRejectForm({
  submitting,
  onSubmit,
  onCancel,
}: {
  submitting: boolean;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [invalid, setInvalid] = useState(false);
  const inputId = "plan-rejection-reason";

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (reason.trim().length === 0) {
          setInvalid(true);
          return;
        }
        onSubmit(reason.trim());
      }}
    >
      <TextField
        id={inputId}
        label={PLAN_REJECT_FORM_ROW.label}
        icon={<MaterialIcon name="block" className="text-[20px] text-cinder" />}
        value={reason}
        invalid={invalid}
        error={invalid ? "A rejection reason is required" : null}
        onChange={(event) => {
          setInvalid(false);
          setReason(event.target.value);
        }}
      />
      <div className="flex items-center gap-2">
        <Button type="submit" variant="crimson" disabled={invalid || submitting}>
          <MaterialIcon name="block" className="text-[18px]" />
          {PLAN_REJECT_FORM_ROW.action}
        </Button>
        <Button variant="primary" onClick={onCancel}>
          {PLAN_REJECT_FORM_ROW.cancel}
        </Button>
      </div>
    </form>
  );
}

export function PlansTable({
  rows,
  projectNames,
  expandedId,
  rejectingId,
  busyId,
  onToggle,
  onAction,
  onRejectSubmit,
  onRejectCancel,
  onDeploy,
}: PlansTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-steel/50 bg-panel/50 shadow-md">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-steel/30 bg-basin/60">
            {PLANS_TABLE_COLUMNS.map((column) => (
              <th
                key={column.id}
                scope="col"
                className="px-4 py-3 font-mono text-label-sm uppercase text-cinder"
              >
                {column.label}
              </th>
            ))}
            <th scope="col" className="w-12 px-4 py-3" aria-label="Details" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <PlanRow
              key={row.id}
              row={row}
              index={index}
              projectName={projectNames.get(row.project) ?? pipelineProjectFallback(row.project)}
              expanded={row.id === expandedId}
              busy={row.id === busyId}
              rejecting={row.id === rejectingId}
              onToggle={onToggle}
              onAction={onAction}
              onRejectSubmit={onRejectSubmit}
              onRejectCancel={onRejectCancel}
              onDeploy={onDeploy}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlanRow({
  row,
  index,
  projectName,
  expanded,
  busy,
  rejecting,
  onToggle,
  onAction,
  onRejectSubmit,
  onRejectCancel,
  onDeploy,
}: {
  row: DeploymentPlan;
  index: number;
  projectName: string;
  expanded: boolean;
  busy: boolean;
  rejecting: boolean;
  onToggle: (planId: string) => void;
  onAction: (planId: string, action: PlanActionId) => void;
  onRejectSubmit: (planId: string, reason: string) => void;
  onRejectCancel: () => void;
  onDeploy: (planId: string, environment: ProjectEnvironment) => void;
}) {
  const detailId = `plan-detail-${row.id}`;
  const actions = PLAN_ACTION_ROWS[row.status];

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.03 }}
        className="border-b border-steel/20 transition-colors hover:bg-basin/40"
      >
        <td className="px-4 py-3">
          <span className="font-mono text-code-md text-foam">v{row.version}</span>
          {row.previousPlan ? (
            <span className="ml-2 font-mono text-label-sm text-cinder">
              {PLAN_COMPONENT_LABELS.revisionOf} {pipelineProjectFallback(row.previousPlan)}
            </span>
          ) : null}
        </td>
        <td className="px-4 py-3">
          <Link
            href={`${PROJECTS_ROUTE.href}/${row.project}`}
            className="font-display text-body-sm text-ice hover:underline"
          >
            {projectName}
          </Link>
        </td>
        <td className="px-4 py-3">
          <PipelineStatusChip chip={PLAN_STATUS_CHIPS[row.status]} />
        </td>
        <td className="px-4 py-3 font-mono text-code-md text-mist">{row.components.length}</td>
        <td className="px-4 py-3 font-mono text-label-sm text-mist">{relativeTime(row.createdAt)}</td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => onToggle(row.id)}
            aria-expanded={expanded}
            aria-controls={detailId}
            aria-label={expanded ? "Hide plan details" : "Show plan details"}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
              expanded
                ? "border-ice/40 bg-ice/10 text-ice"
                : "border-surface-highest text-mist hover:text-haze",
            )}
          >
            <MaterialIcon name={expanded ? "expand_less" : "expand_more"} className="text-[18px]" />
          </button>
        </td>
      </motion.tr>
      {expanded ? (
        <tr>
          <td
            colSpan={PLANS_TABLE_COLUMNS.length + 1}
            className="border-b border-steel/20 bg-basin/30 px-4 pb-5"
          >
            <div id={detailId} className="space-y-4 pt-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {row.components.map((component) => (
                  <PlanComponentCard key={component.name} component={component} />
                ))}
              </div>
              <p className="font-mono text-label-sm text-mist">
                {row.review
                  ? `${PLAN_REVIEW_ROW.decidedLead} ${relativeTime(row.review.decidedAt)}`
                  : PLAN_REVIEW_ROW.awaiting}
                {row.review?.reason ? <span className="text-mist"> · “{row.review.reason}”</span> : null}
              </p>
              {rejecting ? (
                <PlanRejectForm
                  submitting={busy}
                  onSubmit={(reason) => onRejectSubmit(row.id, reason)}
                  onCancel={onRejectCancel}
                />
              ) : (
                <>
                  {actions.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {actions.map((action) => (
                        <Button
                          key={action}
                          variant={PLAN_ACTION_VARIANTS[action]}
                          disabled={busy}
                          onClick={() => onAction(row.id, action)}
                        >
                          <MaterialIcon name={PLAN_ACTION_ICONS[action]} className="text-[18px]" />
                          {PLAN_ACTION_LABELS[action]}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                  {row.status === "APPROVED" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-label-sm uppercase text-cinder">
                        {PLAN_DEPLOY_LEAD}
                      </span>
                      {PLAN_DEPLOY_TARGETS.map((target) => (
                        <button
                          key={target.environment}
                          type="button"
                          disabled={busy}
                          onClick={() => onDeploy(row.id, target.environment)}
                          className="rounded-full border border-teal/40 bg-teal/10 px-3.5 py-1.5 font-mono text-label-sm uppercase text-ice transition-colors hover:bg-teal/20 disabled:opacity-40"
                        >
                          {target.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
