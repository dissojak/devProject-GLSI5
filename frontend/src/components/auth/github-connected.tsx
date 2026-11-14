"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { GITHUB_CONNECTED_COPY } from "@/data/github-picker";
import { GitHubIcon } from "@/shared/icons/github-icon";

type Outcome = keyof typeof GITHUB_CONNECTED_COPY;

const CLOSE_DELAY_MS = 1200;

function outcomeOf(value: string | null): Outcome {
  return value === "repositories-connected" ? "repositories-connected" : "repositories-failed";
}

export function GithubConnected() {
  const outcome = outcomeOf(useSearchParams().get("github"));
  const copy = GITHUB_CONNECTED_COPY[outcome];

  useEffect(() => {
    if (!window.opener) return;
    const id = window.setTimeout(() => window.close(), CLOSE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div role="status" className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-steel bg-panel p-8 text-center shadow-md">
      <GitHubIcon className="size-8 text-foam" />
      <p className="font-display text-headline-sm font-semibold text-foam">{copy.title}</p>
      <p className="font-display text-body-md text-mist">{copy.message}</p>
    </div>
  );
}
