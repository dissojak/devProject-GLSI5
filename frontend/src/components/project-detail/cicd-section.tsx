"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/shared/button";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";
import {
  useCreateCicdPullRequestMutation,
  useGetCicdBuildStatusQuery,
  usePreviewCicdQuery,
  useRequestCicdBuildMutation,
  type BuildStatus,
} from "@/hooks/use-cicd";
import { CicdRunSteps } from "@/components/project-detail/cicd-run-steps";

interface Props {
  projectId: string;
  planId: string;
  approved: boolean;
}

type StatusKey = BuildStatus["status"] | "CHECKING" | "UNREACHABLE";
type Tone = "ice" | "mint" | "champagne" | "crimson" | "mist";
type NextAction = "pullRequest" | "build" | "none";

interface StatusView {
  label: string;
  hint: string;
  tone: Tone;
  action: NextAction;
  actionLabel?: string;
}

const STATUS_VIEW: Record<StatusKey, StatusView> = {
  CHECKING: { label: "Checking GitHub Actions…", hint: "", tone: "mist", action: "none" },
  UNREACHABLE: {
    label: "Can't reach GitHub Actions",
    hint: "Check the repository connection, then refresh.",
    tone: "crimson",
    action: "pullRequest",
  },
  NOT_INSTALLED: {
    label: "Workflow not installed",
    hint: "Open the pull request, then merge it on GitHub.",
    tone: "champagne",
    action: "pullRequest",
  },
  OUTDATED: {
    label: "Workflow out of date",
    hint: "The plan changed. Open a new pull request to update the workflow.",
    tone: "champagne",
    action: "pullRequest",
  },
  NOT_STARTED: {
    label: "Ready to build",
    hint: "The workflow is installed. Run the first build.",
    tone: "ice",
    action: "build",
    actionLabel: "Run Docker build",
  },
  IN_PROGRESS: {
    label: "Building…",
    hint: "GitHub Actions is building and publishing the images.",
    tone: "ice",
    action: "none",
  },
  SUCCESS: {
    label: "Images published",
    hint: "Built and pushed to GitHub Container Registry.",
    tone: "mint",
    action: "build",
    actionLabel: "Rebuild",
  },
  FAILURE: {
    label: "Build failed",
    hint: "Check the logs on GitHub, fix the issue and run it again.",
    tone: "crimson",
    action: "build",
    actionLabel: "Run again",
  },
};

const TONE_DOT: Record<Tone, string> = {
  ice: "bg-ice",
  mint: "bg-mint",
  champagne: "bg-champagne",
  crimson: "bg-crimson",
  mist: "bg-mist",
};

function getErrorMessage(error: unknown): string {
  const data = (error as { data?: { error?: { message?: string } } } | null)?.data;
  if (data?.error?.message) return data.error.message;
  if (error instanceof Error) return error.message;
  return "CI/CD operation failed.";
}

export function CicdSection({ projectId, planId, approved }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pullRequestUrl, setPullRequestUrl] = useState<string | null>(null);

  const previewQuery = usePreviewCicdQuery({ projectId, planId }, { skip: !approved });
  const statusQuery = useGetCicdBuildStatusQuery(
    { projectId, planId },
    { skip: !approved, pollingInterval: 15000 },
  );
  const [createPullRequest, pullRequestState] = useCreateCicdPullRequestMutation();
  const [requestBuild, buildState] = useRequestCicdBuildMutation();

  const preview = previewQuery.data?.data;
  const status = statusQuery.data?.data;
  const statusKey: StatusKey = status?.status ?? (statusQuery.isError ? "UNREACHABLE" : "CHECKING");
  const view =
    statusKey === "UNREACHABLE"
      ? { ...STATUS_VIEW.UNREACHABLE, hint: getErrorMessage(statusQuery.error) }
      : STATUS_VIEW[statusKey];
  const busy = pullRequestState.isLoading || buildState.isLoading;
  const extraFiles = preview ? preview.files.filter((file) => file !== preview.workflowPath) : [];

  async function handleCreatePullRequest() {
    setFeedback(null);
    try {
      const response = await createPullRequest({ projectId, planId }).unwrap();
      setPullRequestUrl(response.data.url);
    } catch (error) {
      setFeedback(getErrorMessage(error));
    }
  }

  async function handleRunBuild() {
    setFeedback(null);
    try {
      await requestBuild({ projectId, planId }).unwrap();
      setFeedback("Build requested. GitHub Actions can take a moment to report it.");
      await statusQuery.refetch();
    } catch {
      setFeedback("Couldn't start the build. Check the workflow is merged and Actions has permission.");
    }
  }

  const actions: Record<NextAction, () => ReactNode> = {
    pullRequest: () =>
      pullRequestUrl ? (
        <a
          href={pullRequestUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-mint/50 px-4 py-2 font-display text-body-sm text-mint hover:bg-mint/10"
        >
          Pull request opened
          <MaterialIcon name="open_in_new" className="text-[16px]" />
        </a>
      ) : (
        <Button
          disabled={busy || !preview}
          onClick={() => void handleCreatePullRequest()}
          className="gap-1.5 px-4 py-2 text-body-sm"
        >
          <MaterialIcon name="merge_type" className="text-[16px]" />
          {pullRequestState.isLoading ? "Opening…" : "Create pull request"}
        </Button>
      ),
    build: () => (
      <Button disabled={busy} onClick={() => void handleRunBuild()} className="gap-1.5 px-4 py-2 text-body-sm">
        <MaterialIcon name="play_circle" className="text-[16px]" />
        {buildState.isLoading ? "Starting…" : view.actionLabel}
      </Button>
    ),
    none: () => null,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-steel/50 bg-basin p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-full",
                TONE_DOT[view.tone],
                statusKey === "IN_PROGRESS" && "animate-pulse",
              )}
            />
            <div className="min-w-0">
              <p role="status" className="font-display text-body-md font-semibold text-foam">
                {view.label}
              </p>
              {view.hint ? <p className="font-display text-body-sm text-mist">{view.hint}</p> : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions[view.action]()}
            <button
              type="button"
              aria-label="Refresh build status"
              onClick={() => void statusQuery.refetch()}
              className="grid size-9 cursor-pointer place-items-center rounded-full border border-steel text-mist hover:text-foam focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/40"
            >
              <MaterialIcon name="refresh" className={cn("text-[18px]", statusQuery.isFetching && "animate-spin")} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-steel/30 pt-3 font-mono text-label-sm text-mist">
          <span>{status?.workflowPath ?? preview?.workflowPath ?? ".github/workflows"}</span>
          {status?.run ? (
            <>
              <span aria-hidden="true">·</span>
              <span>Run #{status.run.id}</span>
              <a
                href={status.run.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-ice hover:underline"
              >
                View logs
                <MaterialIcon name="open_in_new" className="text-[13px]" />
              </a>
            </>
          ) : null}
        </div>
        <CicdRunSteps jobs={status?.run?.jobs ?? []} />
        {feedback ? (
          <p role="alert" className="font-display text-body-sm text-champagne">
            {feedback}
          </p>
        ) : null}
      </div>

      {previewQuery.isError ? (
        <p role="alert" className="font-display text-body-sm text-crimson">
          {getErrorMessage(previewQuery.error)}{" "}
          <button type="button" onClick={() => void previewQuery.refetch()} className="text-ice underline">
            Retry
          </button>
        </p>
      ) : null}

      {preview ? (
        <>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-label-sm uppercase text-cinder">Images</p>
            <ul className="flex flex-col divide-y divide-steel/30 rounded-xl border border-steel/40 bg-basin">
              {preview.components.map((component) => (
                <li
                  key={component.name}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5"
                >
                  <span className="font-display text-body-sm font-semibold text-foam">{component.name}</span>
                  <span title={component.image} className="min-w-0 truncate font-mono text-code-md text-ice">
                    {component.image}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {preview.warnings.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {preview.warnings.map((warning) => (
                <li key={warning} className="flex gap-2 font-display text-body-sm text-champagne">
                  <MaterialIcon name="warning" className="mt-0.5 text-[14px]" />
                  {warning}
                </li>
              ))}
            </ul>
          ) : null}

          <details className="group rounded-xl border border-steel/40 bg-basin">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-display text-body-sm text-foam focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/40">
              What the pull request adds
              <span className="flex items-center gap-2 font-mono text-label-sm text-mist">
                {preview.files.length} files
                <MaterialIcon name="expand_more" className="text-[18px] transition-transform group-open:rotate-180" />
              </span>
            </summary>
            <div className="flex flex-col gap-3 border-t border-steel/30 px-4 py-3">
              <p className="font-display text-body-sm text-mist">
                The workflow below, plus {extraFiles.length} file{extraFiles.length === 1 ? "" : "s"} from step 03:{" "}
                <span className="font-mono text-code-md text-foam">{extraFiles.join(", ")}</span>
              </p>
              <pre className="max-h-80 overflow-auto rounded-lg border border-steel/40 bg-abyss p-4 font-mono text-code-md text-ice">
                <code>{preview.workflow}</code>
              </pre>
            </div>
          </details>
        </>
      ) : null}
    </div>
  );
}
