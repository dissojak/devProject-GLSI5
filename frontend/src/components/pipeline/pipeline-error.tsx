"use client";

import { Button } from "@/shared/button";
import { MaterialIcon } from "@/shared/material-icon";
import type { PipelineErrorRow } from "@/types/pipeline-board";

/** Crimson sheet; `detail` carries the backend message only, never codes. */
export function PipelineError({
  row,
  detail,
  onRetry,
}: {
  row: PipelineErrorRow;
  detail: string | null;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex flex-col items-start gap-4 rounded-2xl border border-crimson/25 bg-surface-mid p-8"
      role="alert"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-crimson/40 bg-crimson/10">
          <MaterialIcon name={row.icon} className="text-[20px] text-crimson" />
        </span>
        <div className="space-y-0.5">
          <p className="font-display text-headline-sm font-bold text-frost">{row.heading}</p>
          <p className="text-body-md text-mist">{row.copy}</p>
        </div>
      </div>
      {detail ? <p className="font-mono text-label-sm text-crimson">{detail}</p> : null}
      <Button variant="crimson" onClick={onRetry}>
        <MaterialIcon name="refresh" className="text-[18px]" />
        {row.actionLabel}
      </Button>
    </div>
  );
}
