import { PROJECT_PAGINATION_ROW } from "@/data/dashboard";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";

export function PaginationBar() {
  return (
    <div className="flex items-center justify-between pb-2 pt-4">
      <div className="w-32" />
      <div className="flex items-center gap-1.5 rounded-full bg-abyss px-2 py-1 shadow-inner">
        <button
          type="button"
          disabled
          className="flex cursor-default items-center gap-1 rounded-full px-3 py-1.5 font-mono text-label-md text-smoke"
        >
          <MaterialIcon name="arrow_back" className="text-[14px]" />
          <span>{PROJECT_PAGINATION_ROW.previousLabel}</span>
        </button>
        <div className="flex items-center gap-1 px-1">
          {PROJECT_PAGINATION_ROW.pages.map((page) =>
            page === PROJECT_PAGINATION_ROW.current ? (
              <span
                key={page}
                aria-current="page"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-ice font-mono text-label-md font-bold text-abyss shadow-sm"
              >
                {page}
              </span>
            ) : (
              <span
                key={page}
                className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-label-md text-smoke"
              >
                {page}
              </span>
            ),
          )}
        </div>
        <button
          type="button"
          disabled
          className="flex cursor-default items-center gap-1 rounded-full px-3 py-1.5 font-mono text-label-md text-smoke"
        >
          <span>{PROJECT_PAGINATION_ROW.nextLabel}</span>
          <MaterialIcon name="arrow_forward" className="text-[14px]" />
        </button>
      </div>
      <div className="w-32 text-right">
        <span className={cn("font-mono text-label-md text-smoke")}>
          {PROJECT_PAGINATION_ROW.statusLabel}
        </span>
      </div>
    </div>
  );
}
