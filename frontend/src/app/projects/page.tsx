import type { Metadata } from "next";
import { ProjectsGuard } from "@/components/dashboard/projects-guard";
import { ProjectsPage } from "@/components/dashboard/projects-page";

export const metadata: Metadata = {
  title: "Projects",
};

export default function Projects() {
  return (
    <ProjectsGuard>
      <ProjectsPage />
    </ProjectsGuard>
  );
}
