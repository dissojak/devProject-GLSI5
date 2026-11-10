import Link from "next/link";

import { buttonClass } from "@/shared/button";
import { MaterialIcon } from "@/shared/material-icon";
import type { PipelineEmptyRow } from "@/types/pipeline-board";

/** An empty board is an invitation to act, not a dead end. */
export function PipelineEmpty({ row, href }: { row: PipelineEmptyRow; href: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-steel/50 bg-panel/40 px-8 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-ice/25 bg-ice/10">
        <MaterialIcon name={row.icon} className="text-[26px] text-ice-dim" />
      </div>
      <div className="space-y-1.5">
        <p className="font-display text-headline-sm font-bold text-frost">{row.heading}</p>
        <p className="mx-auto max-w-md text-body-md text-mist">{row.copy}</p>
      </div>
      <Link href={href} className={buttonClass("primary")}>
        {row.actionLabel}
      </Link>
    </div>
  );
}
