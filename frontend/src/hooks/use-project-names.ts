import { useMemo } from "react";

import { useListProjectsQuery } from "@/store/projects-api";
import { PROJECTS_PAGE_LIMIT } from "@/utils/project-view";

/**
 * Board rows reference projects by id; the sidebar's projects list (same
 * cache tag) supplies the display names. Unknown ids fall back to a short
 * mono hash in the tables.
 */
export function useProjectNames(): Map<string, string> {
  const { data } = useListProjectsQuery({ page: 1, limit: PROJECTS_PAGE_LIMIT });

  return useMemo(() => {
    const names = new Map<string, string>();
    for (const project of data?.data ?? []) {
      names.set(project.id, project.name);
    }

    return names;
  }, [data]);
}
