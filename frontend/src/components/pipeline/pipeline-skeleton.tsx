import { cn } from "@/utils/class-names";

const PULSE_BLOCK = "rounded-xl bg-ice/[0.07]";

/** Pulse placeholders matching the board anatomy: strip + table. */
export function PipelineSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className={cn(PULSE_BLOCK, "h-8 w-72")} />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={cn(PULSE_BLOCK, "h-8 w-24 rounded-full")} />
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-steel/40 bg-panel/40">
        <div className="h-11 border-b border-steel/30 bg-basin/60" />
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className={cn("h-14 border-b border-steel/15", index % 2 === 1 && "bg-basin/20")}
          />
        ))}
      </div>
    </div>
  );
}
