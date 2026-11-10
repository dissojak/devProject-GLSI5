/** Boards fetch the backend page maximum so the strip counts are page-complete. */
export const PIPELINE_PAGE_LIMIT = 50;

/** "1m 22s" / "48s" / "—" for rows without a measured duration. */
export function formatPipelineDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) {
    return "—";
  }
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`;
}

/** Truncated mono stand-in when a row's project is outside the loaded page. */
export function pipelineProjectFallback(projectId: string): string {
  return `#${projectId.slice(-6)}`;
}

/** Census behind the filter strip: every status id plus the "all" total. */
export function pipelineStatusCounts<TData>(
  rows: TData[],
  statusOf: (row: TData) => string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const status = statusOf(row);
    counts[status] = (counts[status] ?? 0) + 1;
  }
  counts.all = rows.length;

  return counts;
}

/** Client-side board filter: "all" keeps the page order untouched. */
export function pipelineFilterRows<TData>(
  rows: TData[],
  activeId: string,
  statusOf: (row: TData) => string,
): TData[] {
  if (activeId === "all") {
    return rows;
  }

  return rows.filter((row) => statusOf(row) === activeId);
}
