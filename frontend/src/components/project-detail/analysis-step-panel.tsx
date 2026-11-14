"use client";

import { motion } from "motion/react";
import { useId } from "react";
import type { ReactNode } from "react";
import { ANALYSIS_VIEWS } from "@/data/project-workflow";
import { cn } from "@/utils/class-names";
import type { AnalysisViewId } from "@/types/analysis";

interface AnalysisStepPanelProps {
  view: AnalysisViewId;
  onView: (view: AnalysisViewId) => void;
  counts: Partial<Record<AnalysisViewId, number>>;
  panels: Record<AnalysisViewId, ReactNode>;
}

export function AnalysisStepPanel({ view, onView, counts, panels }: AnalysisStepPanelProps) {
  const uid = useId();

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Analysis views" className="flex flex-wrap gap-1 border-b border-steel/40">
        {ANALYSIS_VIEWS.map((item) => {
          const selected = item.id === view;
          const count = counts[item.id];
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onView(item.id)}
              className={cn(
                "relative flex cursor-pointer items-center gap-2 px-3 py-2 font-display text-body-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/40",
                selected ? "text-foam" : "text-mist hover:text-foam",
              )}
            >
              {item.label}
              {count !== undefined ? (
                <span className="rounded-full bg-surface-high px-2 py-0.5 font-mono text-label-sm text-mist">
                  {count}
                </span>
              ) : null}
              {selected ? (
                <motion.span
                  layoutId={`${uid}-underline`}
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ice"
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {panels[view]}
      </motion.div>
    </div>
  );
}
