"use client";

import { MaterialIcon } from "@/shared/material-icon";
import { PIPELINE_PAGINATION_ROW } from "@/data/pipeline-boards";
import { cn } from "@/utils/class-names";
import { paginationPageWindow, projectsStatusLabel } from "@/utils/project-view";
import type { ApiListPagination } from "@/types/project";

const PAGE_BUTTON =
  "flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 font-mono text-label-sm transition-colors";

/** Shared pager; hidden entirely while the board fits on one page. */
export function PipelinePagination({
  pagination,
  onPage,
}: {
  pagination: ApiListPagination;
  onPage: (page: number) => void;
}) {
  const pageCount = Math.max(1, pagination.pageCount);
  const page = Math.min(Math.max(1, pagination.page), pageCount);

  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Board pages">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className={cn(PAGE_BUTTON, "border-surface-highest text-mist hover:text-haze disabled:opacity-40")}
      >
        <MaterialIcon name="chevron_left" className="text-[16px]" />
        {PIPELINE_PAGINATION_ROW.previousLabel}
      </button>
      <div className="flex items-center gap-1.5">
        {paginationPageWindow(page, pageCount).map((candidate) => (
          <button
            key={candidate}
            type="button"
            onClick={() => onPage(candidate)}
            aria-current={candidate === page ? "page" : undefined}
            className={cn(
              PAGE_BUTTON,
              candidate === page
                ? "border-ice/50 bg-ice/15 text-ice"
                : "border-transparent text-mist hover:border-surface-highest hover:text-haze",
            )}
          >
            {candidate}
          </button>
        ))}
      </div>
      <p className="font-mono text-label-sm text-mist">{projectsStatusLabel(pagination)}</p>
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onPage(page + 1)}
        className={cn(PAGE_BUTTON, "border-surface-highest text-mist hover:text-haze disabled:opacity-40")}
      >
        {PIPELINE_PAGINATION_ROW.nextLabel}
        <MaterialIcon name="chevron_right" className="text-[16px]" />
      </button>
    </nav>
  );
}
