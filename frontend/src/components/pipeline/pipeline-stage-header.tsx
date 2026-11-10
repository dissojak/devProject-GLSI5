import type { PipelineStageRow } from "@/types/pipeline-board";

/**
 * Stage eyebrow + display title. The stage number is champagne because the
 * three boards are literal stages of one pipeline (analyze → plan → deploy).
 */
export function PipelineStageHeader({ row }: { row: PipelineStageRow }) {
  return (
    <header className="space-y-1.5">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ice">
        <span className="text-champagne">{row.stage}</span>
        <span className="text-cinder"> · </span>
        {row.kind}
      </p>
      <h1 className="font-display text-display-sm font-bold text-frost">{row.title}</h1>
      <p className="text-body-md text-mist">{row.subtitle}</p>
    </header>
  );
}
