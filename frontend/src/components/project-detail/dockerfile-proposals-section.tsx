"use client";

import { useState } from "react";
import { Button } from "@/shared/button";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";
import { proposalFiles } from "@/utils/dockerfile-files";
import {
  useGenerateDockerfileProposalsMutation,
  useInspectDockerfileProposalsQuery,
} from "@/hooks/use-dockerfile-proposals";
import { DockerfileFileBrowser } from "@/components/project-detail/dockerfile-file-browser";
import type {
  DockerfileCandidate,
  GeneratedDockerfile,
} from "@/types/dockerfile-proposals";

interface Props {
  projectId: string;
  analysisId: string;
}

function messageOf(error: unknown): string {
  const response = error as {
    data?: { error?: { message?: string } };
    message?: string;
  } | null;
  return response?.data?.error?.message ?? response?.message ?? "Dockerfile generation failed";
}

function CandidateWorkbench({
  candidate,
  saved,
  busy,
  onSave,
}: {
  candidate: DockerfileCandidate;
  saved: GeneratedDockerfile | undefined;
  busy: boolean;
  onSave: (name: string) => void;
}) {
  const proposal = candidate.proposal;

  return (
    <article className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-body-md font-semibold text-foam">
            {candidate.componentName}
          </p>
          <p className="mt-0.5 font-display text-body-sm text-mist">{candidate.reason}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {proposal ? (
            <span className="rounded-full bg-surface-high px-3 py-1 font-mono text-label-sm text-ice">
              {proposal.strategy} template
            </span>
          ) : null}
          <span className="rounded-full border border-steel px-3 py-1 font-mono text-label-sm text-mist">
            {saved ? `SAVED · ${saved.validation.status}` : candidate.status}
          </span>
        </div>
      </div>

      {proposal ? (
        <>
          <DockerfileFileBrowser files={proposalFiles(proposal)} />

          <div className="flex flex-col gap-4 rounded-xl border border-steel/40 bg-basin p-4 sm:flex-row sm:items-start sm:justify-between">
            {proposal.warnings.length > 0 ? (
              <div className="min-w-0">
                <p className="font-mono text-label-sm uppercase text-champagne">Before you build</p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {proposal.warnings.map((warning) => (
                    <li key={warning} className="flex gap-2 font-display text-body-sm text-mist">
                      <MaterialIcon name="warning" className="mt-0.5 text-[14px] text-champagne" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="font-display text-body-sm text-mist">No warnings for this template.</p>
            )}
            <Button
              disabled={busy || Boolean(saved)}
              onClick={() => onSave(candidate.componentName)}
              className="shrink-0 gap-1.5 px-4 py-2 text-body-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MaterialIcon name={saved ? "check" : "save"} className="text-[16px]" />
              {saved ? "Proposal saved" : busy ? "Saving…" : "Save proposal"}
            </Button>
          </div>
        </>
      ) : null}
    </article>
  );
}

export function DockerfileProposalsSection({ projectId, analysisId }: Props) {
  const { data, isLoading, isFetching, isError, refetch } = useInspectDockerfileProposalsQuery({
    projectId,
    analysisId,
  });
  const [generate, generateState] = useGenerateDockerfileProposalsMutation();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const candidates = data?.data.candidates ?? [];
  const generated = data?.data.generated ?? [];
  const selected =
    candidates.find((candidate) => candidate.componentName === selectedName) ?? candidates[0];

  async function handleSave(name: string) {
    setFeedback(null);
    try {
      await generate({ projectId, analysisId, componentNames: [name] }).unwrap();
      setFeedback(`Proposal saved for ${name}. Build it once before deploying.`);
    } catch (error) {
      setFeedback(messageOf(error));
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-headline-sm font-semibold text-foam">
            Dockerfile proposal
          </h3>
          <p className="mt-1 font-display text-body-sm text-mist">
            Generated from the analysis when the repository has no Dockerfile. Review each file
            and build it before deploying.
          </p>
        </div>
        <Button
          variant="teal"
          disabled={isFetching}
          onClick={() => void refetch()}
          className="gap-1.5 px-3 py-1 text-body-sm"
        >
          <MaterialIcon name="refresh" className={cn("text-[16px]", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {feedback ? (
        <p role="status" className="rounded-lg border border-steel bg-basin p-3 font-display text-body-sm text-foam">
          {feedback}
        </p>
      ) : null}

      {isLoading ? (
        <p className="font-display text-body-sm text-mist">Inspecting repository analysis…</p>
      ) : null}

      {isError ? (
        <p role="alert" className="font-display text-body-sm text-crimson">
          Couldn&apos;t load Dockerfile proposals. Select Refresh to try again.
        </p>
      ) : null}

      {!isLoading && !isError && candidates.length === 0 ? (
        <p className="font-display text-body-sm text-mist">
          No component needs a generated Dockerfile.
        </p>
      ) : null}

      {candidates.length > 1 ? (
        <div role="group" aria-label="Components" className="flex flex-wrap gap-2">
          {candidates.map((candidate) => (
            <button
              key={candidate.componentName}
              type="button"
              aria-pressed={candidate === selected}
              onClick={() => setSelectedName(candidate.componentName)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 font-mono text-label-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/40",
                candidate === selected
                  ? "border-ice/50 bg-ice/10 text-foam"
                  : "border-steel text-mist hover:text-foam",
              )}
            >
              {candidate.componentName}
            </button>
          ))}
        </div>
      ) : null}

      {selected ? (
        <CandidateWorkbench
          key={selected.componentName}
          candidate={selected}
          saved={generated.find((file) => file.path === selected.path)}
          busy={generateState.isLoading}
          onSave={(name) => void handleSave(name)}
        />
      ) : null}
    </section>
  );
}
