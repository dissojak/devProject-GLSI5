"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Fragment, useState } from "react";
import { Button } from "@/shared/button";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";
import type { Analysis } from "@/types/analysis";

function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const COLUMN_COUNT = 8;

function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function AnalysisDetails({
  analysis,
  onOpen,
}: {
  analysis: Analysis;
  onOpen: (id: string) => void;
}) {
  const findings = analysis.docker.findings;
  const errors = findings.filter((f) => f.severity === "ERROR").length;
  const stats = [
    { label: "Components", value: countLabel(analysis.components.length, "component") },
    { label: "Technologies", value: countLabel(analysis.technologies.length, "technology", "technologies") },
    {
      label: "Docker",
      value: `${analysis.docker.hasDockerfile ? "Dockerfile" : "No Dockerfile"} · ${analysis.docker.hasCompose ? "compose" : "no compose"}`,
    },
    {
      label: "Docker findings",
      value: `${countLabel(findings.length, "finding")}${errors > 0 ? ` · ${errors} blocking` : ""}`,
    },
    { label: "Detected files", value: countLabel(analysis.detectedFiles.length, "file") },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex flex-col gap-4 border-l-2 border-ice/40 bg-basin/50 px-5 py-4"
    >
      {analysis.status === "FAILED" && analysis.error ? (
        <p className="font-display text-body-sm text-crimson">
          {analysis.error.code}: {analysis.error.message}
        </p>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-steel/40 bg-basin px-3 py-2">
            <dt className="font-mono text-label-sm uppercase text-cinder">{stat.label}</dt>
            <dd className="mt-1 font-display text-body-sm text-foam">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {analysis.components.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {analysis.components.map((component) => (
            <span
              key={component.name}
              className="flex items-center gap-2 rounded-lg bg-surface-high px-2.5 py-1 font-mono text-label-sm text-foam"
            >
              {component.name}
              <span className="text-mist">{component.type}</span>
            </span>
          ))}
        </div>
      ) : null}

      {analysis.technologies.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {analysis.technologies.map((t) => (
            <span
              key={`${t.category}:${t.name}`}
              className="rounded bg-surface-high/60 px-2 py-0.5 font-mono text-label-sm text-mist"
            >
              {t.version ? `${t.name} ${t.version}` : t.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button onClick={() => onOpen(analysis.id)} className="gap-1.5 px-4 py-2 text-body-sm">
          Open full analysis
          <MaterialIcon name="arrow_forward" className="text-[16px]" />
        </Button>
      </div>
    </motion.div>
  );
}

export function AnalysesTable({
  analyses,
  selectedId,
  onSelect,
}: {
  analyses: Analysis[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (analyses.length === 0) {
    return (
      <div className="rounded-2xl border border-steel bg-panel p-6 shadow-md">
        <p className="font-display text-body-md text-mist">No analyses yet.</p>
      </div>
    );
  }
  return (
    <MotionConfig reducedMotion="user">
      <div className="overflow-hidden rounded-2xl border border-steel bg-panel shadow-md">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-steel/40 bg-basin/60 text-left">
              <th className="px-4 py-3 font-mono text-label-sm uppercase text-cinder">#</th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase text-cinder">Status</th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase text-cinder">Branch</th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase text-cinder">Technologies</th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase text-cinder">Docker</th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase text-cinder">Duration</th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase text-cinder">Started</th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase text-cinder">View</th>
            </tr>
          </thead>
          <tbody>
            {analyses.map((analysis, index) => {
              const active = analysis.id === selectedId;
              const techCount = analysis.technologies.length;
              const shown = analysis.technologies.slice(0, 3);
              const extra = techCount - shown.length;
              const expanded = analysis.id === expandedId;
              const detailsId = `analysis-details-${analysis.id}`;
              return (
                <Fragment key={analysis.id}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "border-b border-steel/20 transition-colors",
                      active ? "bg-ice/5" : "hover:bg-basin/40",
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-code-md text-foam">#{analysis.number}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 font-mono text-label-sm uppercase",
                          analysis.status === "COMPLETED"
                            ? "bg-mint/15 text-mint"
                            : analysis.status === "FAILED"
                              ? "bg-crimson/15 text-crimson"
                              : analysis.status === "RUNNING"
                                ? "bg-ice/15 text-ice"
                                : "bg-mist/15 text-mist",
                        )}
                      >
                        {analysis.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-code-md text-mist">{analysis.branch}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {shown.map((t) => (
                          <span key={t.name} className="rounded bg-surface-high px-2 py-0.5 font-mono text-label-sm text-foam">
                            {t.name}
                          </span>
                        ))}
                        {extra > 0 ? (
                          <span className="font-mono text-label-sm text-mist">+{extra}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-code-md text-mist">
                      {analysis.docker.hasDockerfile ? "Dockerfile" : "—"}
                      {analysis.docker.findings.some((f) => f.severity === "ERROR") ? " · blocking" : ""}
                    </td>
                    <td className="px-4 py-3 font-mono text-code-md text-mist">
                      {formatDuration(analysis.durationMs)}
                    </td>
                    <td className="px-4 py-3 font-mono text-label-sm text-mist">
                      {new Date(analysis.startedAt ?? analysis.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={detailsId}
                        onClick={() => setExpandedId(expanded ? null : analysis.id)}
                        className={cn(
                          "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 font-display text-body-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/40",
                          expanded
                            ? "border-ice/50 bg-ice/10 text-foam"
                            : "border-steel/60 text-ice hover:border-ice/50 hover:bg-ice/5",
                        )}
                      >
                        <MaterialIcon name="visibility" className="text-[16px]" />
                        {expanded ? "Hide" : "View"}
                        <motion.span
                          animate={{ rotate: expanded ? 180 : 0 }}
                          transition={{ duration: 0.18 }}
                          className="flex"
                        >
                          <MaterialIcon name="expand_more" className="text-[16px]" />
                        </motion.span>
                      </button>
                    </td>
                  </motion.tr>
                  <tr id={detailsId} className={cn(expanded && "border-b border-steel/20")}>
                    <td colSpan={COLUMN_COUNT} className="p-0">
                      <AnimatePresence initial={false}>
                        {expanded ? <AnalysisDetails analysis={analysis} onOpen={onSelect} /> : null}
                      </AnimatePresence>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </MotionConfig>
  );
}
