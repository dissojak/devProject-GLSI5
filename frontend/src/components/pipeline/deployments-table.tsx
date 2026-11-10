"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { PipelineStatusChip } from "@/components/pipeline/pipeline-status-chip";
import {
  ARGO_HEALTH_CHIPS,
  ARGO_SYNC_CHIPS,
  DEPLOYMENT_CANCELLABLE,
  DEPLOYMENT_CANCEL_LABEL,
  DEPLOYMENT_ENVIRONMENT_BORDERS,
  DEPLOYMENT_ENVIRONMENT_CHIPS,
  DEPLOYMENT_LIVE_STATUS,
  DEPLOYMENT_STATUS_CHIPS,
  DEPLOYMENTS_TABLE_COLUMNS,
} from "@/data/deployments-board";
import { PROJECTS_ROUTE } from "@/data/dashboard";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";
import { formatPipelineDuration, pipelineProjectFallback } from "@/utils/pipeline-view";
import { relativeTime } from "@/utils/relative-time";
import type { Deployment } from "@/types/deployment";

function ArgoCell({ deployment }: { deployment: Deployment }) {
  const application = deployment.argo.applicationName;
  const sync = deployment.argo.syncStatus;
  const health = deployment.argo.healthStatus;

  if (!application && !sync && !health) {
    return <span className="font-mono text-code-md text-cinder">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {application ? (
        <span className="font-mono text-code-md text-foam">{application}</span>
      ) : null}
      {sync ? <PipelineStatusChip chip={ARGO_SYNC_CHIPS[sync]} /> : null}
      {health ? <PipelineStatusChip chip={ARGO_HEALTH_CHIPS[health]} /> : null}
    </div>
  );
}

export function DeploymentsTable({
  rows,
  projectNames,
  busyId,
  onCancel,
}: {
  rows: Deployment[];
  projectNames: Map<string, string>;
  busyId: string | null;
  onCancel: (deploymentId: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-steel/50 bg-panel/50 shadow-md">
      <table className="w-full min-w-[780px] border-collapse text-left">
        <thead>
          <tr className="border-b border-steel/30 bg-basin/60">
            {DEPLOYMENTS_TABLE_COLUMNS.map((column) => (
              <th
                key={column.id}
                scope="col"
                className="px-4 py-3 font-mono text-label-sm uppercase text-cinder"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <DeploymentRow
              key={row.id}
              row={row}
              index={index}
              projectName={projectNames.get(row.project) ?? pipelineProjectFallback(row.project)}
              busy={row.id === busyId}
              onCancel={onCancel}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeploymentRow({
  row,
  index,
  projectName,
  busy,
  onCancel,
}: {
  row: Deployment;
  index: number;
  projectName: string;
  busy: boolean;
  onCancel: (deploymentId: string) => void;
}) {
  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.03 }}
        className={cn(
          "border-b border-steel/20 border-l-4 transition-colors hover:bg-basin/40",
          DEPLOYMENT_ENVIRONMENT_BORDERS[row.environment],
        )}
      >
        <td className="px-4 py-3">
          <PipelineStatusChip chip={DEPLOYMENT_ENVIRONMENT_CHIPS[row.environment]} />
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
          <PipelineStatusChip
            chip={DEPLOYMENT_STATUS_CHIPS[row.status]}
            live={DEPLOYMENT_LIVE_STATUS[row.status]}
          />
        </td>
        <td className="px-4 py-3 font-mono text-code-md text-mist">v{row.planVersion}</td>
        <td className="px-4 py-3">
          <ArgoCell deployment={row} />
        </td>
        <td className="px-4 py-3 font-mono text-code-md text-mist">
          {formatPipelineDuration(row.durationMs)}
        </td>
        <td className="px-4 py-3 font-mono text-label-sm text-mist">
          {relativeTime(row.startedAt ?? row.createdAt)}
        </td>
        <td className="px-4 py-3">
          {DEPLOYMENT_CANCELLABLE[row.status] ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onCancel(row.id)}
              className="flex items-center gap-1.5 rounded-full border border-crimson/40 bg-crimson/10 px-3 py-1.5 font-mono text-label-sm uppercase text-crimson transition-colors hover:bg-crimson/20 disabled:opacity-40"
            >
              <MaterialIcon name="close" className="text-[14px]" />
              {DEPLOYMENT_CANCEL_LABEL}
            </button>
          ) : (
            <span className="font-mono text-code-md text-cinder">—</span>
          )}
        </td>
      </motion.tr>
      {row.error ? (
        <tr className="border-b border-steel/20 bg-basin/30">
          <td colSpan={DEPLOYMENTS_TABLE_COLUMNS.length} className="px-4 py-2">
            <p className="flex items-center gap-2 font-mono text-label-sm text-crimson" role="alert">
              <MaterialIcon name="warning" className="text-[14px]" />
              {row.error.message}
            </p>
          </td>
        </tr>
      ) : null}
    </>
  );
}
