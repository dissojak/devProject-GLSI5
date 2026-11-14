"use client";

import { cn } from "@/utils/class-names";
import { MaterialIcon } from "@/shared/material-icon";
import { Button } from "@/shared/button";
import type { Project } from "@/types/project";

export function ProjectHeader({
  project,
  onRun,
  running,
  launchPending,
  invalidRepo,
}: {
  project: Project;
  onRun: () => void;
  running: boolean;
  launchPending: boolean;
  invalidRepo: boolean;
}) {
  const runDisabled = invalidRepo || running || launchPending;
  const runTitle = invalidRepo
    ? "Verify the repository before running an analysis"
    : running
      ? "An analysis is already in progress"
      : "Run a new analysis";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-headline-lg font-bold tracking-tight text-foam">
              {project.name}
            </h1>
            <span className="rounded-full bg-surface-high px-2.5 py-0.5 font-mono text-label-sm uppercase text-mist">
              {project.environment}
            </span>
          </div>
          {project.description ? (
            <p className="mt-2 max-w-2xl font-display text-body-md text-mist">
              {project.description}
            </p>
          ) : null}
        </div>
        <div title={runTitle}>
          <Button
            onClick={onRun}
            disabled={runDisabled}
            className="h-10 gap-2 px-5 font-bold shadow-ice-submit hover:shadow-ice-halo disabled:opacity-50"
          >
            <MaterialIcon
              name={running || launchPending ? "progress_activity" : "play_circle"}
              className={cn("text-[18px]", (running || launchPending) && "animate-spin")}
            />
            <span>
              {running
                ? "Analysis in progress"
                : launchPending
                  ? "Starting…"
                  : "Run analysis"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
