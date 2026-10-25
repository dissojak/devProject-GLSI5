"use client";

import { AnimatePresence, MotionConfig } from "motion/react";
import { useState } from "react";
import { PROJECT_ROWS } from "@/data/dashboard";
import type {
  DashboardFilterId,
  DashboardViewMode,
} from "@/types/dashboard";
import { useAuthSession } from "@/hooks/use-auth-session";
import { firstName } from "@/utils/identity";
import { DashboardEmptyContent, DashboardEmptyStats } from "@/components/dashboard/dashboard-empty";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NewProjectModal } from "@/components/dashboard/new-project-modal";
import { PaginationBar } from "@/components/dashboard/pagination-bar";
import { ProjectGrid } from "@/components/dashboard/project-grid";
import { ProjectsToolbar } from "@/components/dashboard/projects-toolbar";
import { StatGrid } from "@/components/dashboard/stat-grid";

export function DashboardView() {
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<DashboardFilterId>("all");
  const [viewMode, setViewMode] = useState<DashboardViewMode>("grid");
  const { user } = useAuthSession();
  const projectsEmpty = PROJECT_ROWS.length === 0;
  const visibleRows =
    filter === "all"
      ? PROJECT_ROWS
      : PROJECT_ROWS.filter((row) => row.environment === filter);

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex w-full flex-col space-y-8 p-8">
        <DashboardHeader
          name={user ? firstName(user.name) : ""}
          onCreate={() => setModalOpen(true)}
        />
        {projectsEmpty ? (
          <>
            <DashboardEmptyStats />
            <DashboardEmptyContent onCreate={() => setModalOpen(true)} />
          </>
        ) : (
          <>
            <StatGrid />
            <ProjectsToolbar
              filter={filter}
              onFilter={setFilter}
              viewMode={viewMode}
              onView={setViewMode}
            />
            <ProjectGrid rows={visibleRows} />
            <PaginationBar />
          </>
        )}
        <AnimatePresence>
          {modalOpen ? (
            <NewProjectModal
              onClose={() => setModalOpen(false)}
              existingNames={PROJECT_ROWS.map((row) => row.name)}
              onComplete={() => setModalOpen(false)}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
