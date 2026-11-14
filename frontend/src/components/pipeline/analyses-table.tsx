"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { PipelineStatusChip } from "@/components/pipeline/pipeline-status-chip";
import {
  ANALYSES_TABLE_COLUMNS,
  ANALYSES_TECH_PREVIEW_COUNT,
  ANALYSIS_LIVE_STATUS,
  ANALYSIS_ROW_ACTIONS,
  ANALYSIS_STATUS_CHIPS,
} from "@/data/analyses-board";
import { PROJECTS_ROUTE } from "@/data/dashboard";
import { Button } from "@/shared/button";
import { cn } from "@/utils/class-names";
import { MaterialIcon } from "@/shared/material-icon";
import { formatPipelineDuration, pipelineProjectFallback } from "@/utils/pipeline-view";
import { relativeTime } from "@/utils/relative-time";
import type { Analysis } from "@/types/analysis";

interface AnalysesTableProps {
  rows: Analysis[];
  projectNames: Map<string, string>;
  /** The analysis mid-draft, if any; every other action button waits. */
  busyId: string | null;
  onDraft: (projectId: string, analysisId: string) => void;
}

function TechnologiesCell({ analysis }: { analysis: Analysis }) {
  const shown = analysis.technologies.slice(0, ANALYSES_TECH_PREVIEW_COUNT);
  const extra = analysis.technologies.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((technology) => (
        <span
          key={technology.name}
          className="rounded bg-surface-high px-2 py-0.5 font-mono text-label-sm text-foam"
        >
          {technology.name}
        </span>
      ))}
      {extra > 0 ? (
        <span className="font-mono text-label-sm text-mist">+{extra}</span>
      ) : null}
    </div>
  );
}

export function AnalysesTable({ rows, projectNames, busyId, onDraft }: AnalysesTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-steel/50 bg-panel/50 shadow-md">
      <table className="w-full min-w-[860px] border-collapse text-left">
        <thead>
          <tr className="border-b border-steel/30 bg-basin/60">
            {ANALYSES_TABLE_COLUMNS.map((column) => (
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
          {rows.map((row, index) => {
            const action = ANALYSIS_ROW_ACTIONS[row.status];

            return (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="border-b border-steel/20 transition-colors last:border-b-0 hover:bg-basin/40"
              >
                <td className="px-4 py-3 font-mono text-code-md text-foam">#{row.number}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`${PROJECTS_ROUTE.href}/${row.project}`}
                    className="font-display text-body-sm text-ice hover:underline"
                  >
                    {projectNames.get(row.project) ?? pipelineProjectFallback(row.project)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <PipelineStatusChip
                    chip={ANALYSIS_STATUS_CHIPS[row.status]}
                    live={ANALYSIS_LIVE_STATUS[row.status]}
                  />
                </td>
                <td className="px-4 py-3 font-mono text-code-md text-mist">{row.branch}</td>
                <td className="px-4 py-3">
                  <TechnologiesCell analysis={row} />
                </td>
                <td className="px-4 py-3 font-mono text-code-md text-mist">
                  {formatPipelineDuration(row.durationMs)}
                </td>
                <td className="px-4 py-3 font-mono text-label-sm text-mist">
                  {relativeTime(row.startedAt ?? row.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {action ? (
                    <Button
                      variant={action.variant}
                      size="sm"
                      disabled={busyId !== null}
                      aria-busy={busyId === row.id}
                      onClick={() => onDraft(row.project, row.id)}
                    >
                      <MaterialIcon
                        name={busyId === row.id ? "progress_activity" : action.icon}
                        className={cn("text-[16px]", busyId === row.id && "animate-spin")}
                      />
                      {action.label}
                    </Button>
                  ) : null}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
