"use client";

import { cn } from "@/utils/class-names";
import type { PipelineFilterRow } from "@/types/pipeline-board";

/** Filter chips double as the status census of the loaded page. */
export function PipelineFilterStrip({
  rows,
  counts,
  activeId,
  onSelect,
}: {
  rows: PipelineFilterRow[];
  counts: Record<string, number>;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Status filters">
      {rows.map((row) => {
        const active = row.id === activeId;
        return (
          <button
            key={row.id}
            type="button"
            onClick={() => onSelect(row.id)}
            aria-pressed={active}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-label-sm uppercase transition-colors",
              active
                ? "border-ice/50 bg-ice/15 text-ice"
                : "border-surface-highest bg-surface-mid text-mist hover:border-ice/30 hover:text-haze",
            )}
          >
            {row.label}
            <span
              className={cn(
                "text-[10px]",
                active ? "text-ice-dim" : "text-cinder",
              )}
            >
              {counts[row.id] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
