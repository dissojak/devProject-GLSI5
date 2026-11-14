"use client";

import { MotionConfig, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/utils/class-names";
import type { Analysis } from "@/types/analysis";
import { AnalysisFindings } from "@/components/project-detail/analysis-findings";

export function AnalysisSummary({ analysis }: { analysis: Analysis | null }) {
  const [now, setNow] = useState(0);
  const running = analysis?.status === "PENDING" || analysis?.status === "RUNNING";
  useEffect(() => {
    if (!running || !analysis) return;
    const id0 = window.setTimeout(() => setNow(Date.now()), 0);
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { window.clearTimeout(id0); window.clearInterval(id); };
  }, [running, analysis]);

  if (!analysis) {
    return (
      <div className="rounded-2xl border border-steel bg-panel p-6 shadow-md">
        <p className="font-display text-body-md text-mist">No analysis yet. Select Run analysis to scan the repository.</p>
      </div>
    );
  }

  const started = analysis.startedAt ? new Date(analysis.startedAt).getTime() : now;
  const elapsed = running ? Math.max(0, now - started) : analysis.durationMs ?? 0;
  const progress = running ? Math.min(90, 10 + (elapsed / 1000) * 4) : 100;

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        key={analysis.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        className="flex flex-col gap-6 rounded-2xl border border-steel bg-panel p-6 shadow-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-headline-sm font-bold text-foam">
              Analysis #{analysis.number}
            </p>
            <p className="font-mono text-label-sm text-mist">
              {analysis.branch} · {analysis.status} · started{" "}
              {analysis.startedAt ? new Date(analysis.startedAt).toLocaleString() : "—"}
            </p>
          </div>
          <StatusPill status={analysis.status} />
        </div>

        {running ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between font-mono text-label-sm text-mist">
              <span>Analyzing repository…</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-basin">
              <motion.div
                className="h-full rounded-full bg-ice"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <p className="font-display text-body-sm text-mist">
              Elapsed {formatDuration(elapsed)}. Step progress is estimated — the backend does not expose per-step status.
            </p>
          </div>
        ) : null}

        {analysis.status === "FAILED" && analysis.error ? (
          <div className="rounded-xl border border-crimson/40 bg-crimson/10 p-4">
            <p className="font-display text-body-md font-semibold text-crimson">
              {analysis.error.code}
            </p>
            <p className="mt-1 font-display text-body-sm text-mist">{analysis.error.message}</p>
          </div>
        ) : null}

        {analysis.status === "COMPLETED" ? <AnalysisFindings analysis={analysis} /> : null}
      </motion.div>
    </MotionConfig>
  );
}

function StatusPill({ status }: { status: Analysis["status"] }) {
  const classes =
    status === "COMPLETED"
      ? "bg-mint/15 text-mint"
      : status === "FAILED"
        ? "bg-crimson/15 text-crimson"
        : status === "RUNNING"
          ? "bg-ice/15 text-ice"
          : "bg-mist/15 text-mist";
  return (
    <span className={cn("rounded-full px-3 py-1 font-mono text-label-sm uppercase", classes)}>
      {status}
    </span>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
