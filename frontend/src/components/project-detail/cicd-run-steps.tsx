"use client";

import { Fragment } from "react";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";
import { runStepState, stepDuration, type RunStepState } from "@/utils/run-steps";
import type { BuildLogLine, BuildRunJob } from "@/hooks/use-cicd";
import type { MaterialIconName } from "@/types/icons";

const STATE_ICONS: Record<RunStepState, { icon: MaterialIconName; className: string }> = {
  success: { icon: "check_circle", className: "text-mint" },
  failure: { icon: "error", className: "text-crimson" },
  running: { icon: "progress_activity", className: "animate-spin text-ice" },
  queued: { icon: "schedule", className: "text-mist" },
  skipped: { icon: "block", className: "text-cinder" },
};

function ErrorOutput({ lines }: { lines: BuildLogLine[] }) {
  return (
    <li className="px-4 pb-3 pl-11">
      <p className="pb-1.5 font-mono text-label-sm uppercase text-crimson">Error output</p>
      <pre className="max-h-72 overflow-auto rounded-lg border border-crimson/30 bg-abyss p-3 font-mono text-code-md">
        <code>
          {lines.map((line, index) => (
            <span
              key={`${index}:${line.text}`}
              className={cn(
                "block whitespace-pre-wrap break-words",
                line.error ? "text-crimson" : "text-mist",
              )}
            >
              {line.text}
            </span>
          ))}
        </code>
      </pre>
    </li>
  );
}

function StateIcon({ state }: { state: RunStepState }) {
  const { icon, className } = STATE_ICONS[state];
  return <MaterialIcon name={icon} fill className={cn("shrink-0 text-[18px]", className)} />;
}

export function CicdRunSteps({ jobs }: { jobs: BuildRunJob[] }) {
  if (jobs.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      {jobs.map((job) => {
        const jobState = runStepState(job.status, job.conclusion);
        const excerpt = job.errorExcerpt ?? [];
        const failedStep = job.steps.find(
          (step) => runStepState(step.status, step.conclusion) === "failure",
        );
        return (
          <li key={job.id}>
            <details
              open={jobState === "failure" || jobState === "running"}
              className="group rounded-xl border border-steel/40 bg-basin"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/40">
                <MaterialIcon
                  name="chevron_right"
                  className="text-[18px] text-mist transition-transform group-open:rotate-90"
                />
                <StateIcon state={jobState} />
                <span className="min-w-0 flex-1 truncate font-display text-body-sm font-semibold text-foam">
                  {job.name}
                </span>
                <span className="font-mono text-label-sm text-mist">
                  {stepDuration(job.startedAt, job.completedAt)}
                </span>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${job.name} on GitHub`}
                  className="text-mist hover:text-ice"
                >
                  <MaterialIcon name="open_in_new" className="text-[16px]" />
                </a>
              </summary>
              <ol className="flex flex-col border-t border-steel/30 py-1">
                {job.steps.map((step) => {
                  const state = runStepState(step.status, step.conclusion);
                  return (
                    <Fragment key={step.number}>
                      <li
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 pl-11",
                          state === "failure" && "bg-crimson/10",
                        )}
                      >
                        <StateIcon state={state} />
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate font-display text-body-sm",
                            state === "failure" ? "text-crimson" : "text-foam",
                            state === "skipped" && "text-cinder",
                          )}
                        >
                          {step.name}
                        </span>
                        <span className="font-mono text-label-sm text-mist">
                          {stepDuration(step.startedAt, step.completedAt)}
                        </span>
                      </li>
                      {step === failedStep && excerpt.length > 0 ? <ErrorOutput lines={excerpt} /> : null}
                    </Fragment>
                  );
                })}
                {!failedStep && excerpt.length > 0 ? <ErrorOutput lines={excerpt} /> : null}
              </ol>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
