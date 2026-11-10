import { cn } from "@/utils/class-names";
import type { StatusChipRow } from "@/types/pipeline-board";

/** Mono status chip; `live` adds the pulse dot for rows still in flight. */
export function PipelineStatusChip({ chip, live }: { chip: StatusChipRow; live?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-label-sm uppercase",
        chip.classes,
      )}
    >
      {live ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current motion-safe:animate-pulse" />
      ) : null}
      {chip.label}
    </span>
  );
}
