import { PROFILE_SKELETON_ROW } from "@/data/profile";
import { cn } from "@/utils/class-names";

const PULSE_BLOCK = "rounded-xl bg-ice/[0.07]";

/** Screen 6-A: chrome stays mounted while `/profile` hydrates. */
export function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label={PROFILE_SKELETON_ROW.liveChip} className="space-y-5">
      <span
        aria-hidden="true"
        className="inline-flex items-center gap-2 rounded-full border border-ice/25 bg-panel/70 px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-ice"
      >
        {PROFILE_SKELETON_ROW.liveChip}
      </span>
      <div className="rounded-2xl border border-ice/20 bg-surface-mid p-6">
        <div aria-hidden="true" className="flex items-center gap-4">
          <div className={cn(PULSE_BLOCK, "h-16 w-16 rounded-full")} />
          <div className="flex-1 space-y-2">
            <div className={cn(PULSE_BLOCK, "h-4 w-1/3")} />
            <div className={cn(PULSE_BLOCK, "h-3 w-1/4")} />
          </div>
        </div>
        <div aria-hidden="true" className="mt-6 space-y-4">
          <div className={cn(PULSE_BLOCK, "h-11 w-full")} />
          <div className={cn(PULSE_BLOCK, "h-11 w-full")} />
          <div className={cn(PULSE_BLOCK, "h-11 w-2/3")} />
          <div className="flex justify-end gap-2 pt-1">
            <div className={cn(PULSE_BLOCK, "h-9 w-24 rounded-full")} />
            <div className={cn(PULSE_BLOCK, "h-9 w-32 rounded-full")} />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-ice/20 bg-surface-mid p-6">
        <div aria-hidden="true" className="flex items-center justify-between">
          <div className={cn(PULSE_BLOCK, "h-4 w-1/2")} />
          <div className={cn(PULSE_BLOCK, "h-9 w-36 rounded-full")} />
        </div>
      </div>
    </div>
  );
}
