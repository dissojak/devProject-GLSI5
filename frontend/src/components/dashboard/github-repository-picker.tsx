"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GITHUB_CONNECTED_ROUTE, GITHUB_PICKER_COPY } from "@/data/github-picker";
import {
  useDisconnectGithubMutation,
  useGetGithubConnectionQuery,
  useListGithubRepositoriesQuery,
  useStartGithubConnectionMutation,
} from "@/hooks/use-github-connection";
import { Button } from "@/shared/button";
import { GitHubIcon } from "@/shared/icons/github-icon";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";
import { apiErrorMessage } from "@/utils/api-error";
import { filterGithubRepositories, sameRepositoryUrl } from "@/utils/github-repositories";
import type { GithubRepositorySummary } from "@/types/github";

const POPUP_FEATURES = "width=720,height=820";
const POPUP_POLL_MS = 800;

interface GithubRepositoryPickerProps {
  selectedUrl: string;
  disabled: boolean;
  onPick: (repository: GithubRepositorySummary) => void;
}

export function GithubRepositoryPicker({ selectedUrl, disabled, onPick }: GithubRepositoryPickerProps) {
  const copy = GITHUB_PICKER_COPY;
  const status = useGetGithubConnectionQuery();
  const connection = status.data?.data;
  const repositories = useListGithubRepositoriesQuery(undefined, { skip: !connection?.connected });
  const [start, startState] = useStartGithubConnectionMutation();
  const [disconnect, disconnectState] = useDisconnectGithubMutation();
  const [search, setSearch] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);

  const visible = useMemo(
    () => filterGithubRepositories(repositories.data?.data ?? [], search),
    [repositories.data, search],
  );

  useEffect(() => {
    if (!waiting) return;
    const id = window.setInterval(() => {
      if (popupRef.current?.closed) {
        setWaiting(false);
        void status.refetch();
      }
    }, POPUP_POLL_MS);
    return () => window.clearInterval(id);
  }, [waiting, status]);

  async function handleConnect() {
    setError(null);
    const popup = window.open("", "github-connect", POPUP_FEATURES);
    const returnTo = popup
      ? GITHUB_CONNECTED_ROUTE
      : `${window.location.pathname}${window.location.search}`;
    try {
      const { data } = await start({ returnTo }).unwrap();
      if (!popup) {
        window.location.assign(data.url);
        return;
      }
      popup.location.href = data.url;
      popupRef.current = popup;
      setWaiting(true);
    } catch (caught) {
      popup?.close();
      setError(apiErrorMessage(caught, "Could not reach GitHub. Try again."));
    }
  }

  if (status.isLoading) {
    return (
      <div className="h-[72px] animate-pulse rounded-xl border border-steel/40 bg-basin/60" />
    );
  }

  if (!connection?.connected) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-steel/50 bg-basin/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <GitHubIcon className="mt-0.5 size-5 shrink-0 text-foam" />
          <div>
            <p className="font-display text-body-md font-semibold text-foam">{copy.title}</p>
            <p className="font-display text-body-sm text-mist">{copy.connectHint}</p>
            {error ? (
              <p role="alert" className="mt-1 font-display text-body-sm text-crimson">
                {error}
              </p>
            ) : null}
          </div>
        </div>
        <Button
          variant="teal"
          size="sm"
          disabled={disabled || startState.isLoading || waiting}
          onClick={() => void handleConnect()}
        >
          <GitHubIcon className={cn("size-4", waiting && "animate-pulse")} />
          {waiting ? copy.connecting : copy.connect}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-steel/50 bg-basin/60 p-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="flex min-w-0 items-center gap-2 font-display text-body-sm text-mist">
          <GitHubIcon className="size-4 shrink-0 text-foam" />
          <span className="truncate">
            {copy.connectedAs} <span className="font-semibold text-foam">@{connection.login}</span>
          </span>
        </p>
        <button
          type="button"
          disabled={disabled || disconnectState.isLoading}
          onClick={() => void disconnect()}
          className="shrink-0 cursor-pointer rounded font-display text-body-sm text-mist hover:text-crimson focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/40 disabled:opacity-50"
        >
          {copy.disconnect}
        </button>
      </div>

      <div className="relative">
        <MaterialIcon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-mist"
        />
        <input
          type="search"
          aria-label={copy.search}
          placeholder={copy.search}
          value={search}
          disabled={disabled}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          className="h-10 w-full rounded-lg border border-steel/60 bg-abyss pl-9 pr-3 font-display text-body-sm text-foam outline-none placeholder:text-mist/60 focus:border-teal focus:ring-1 focus:ring-teal"
        />
      </div>

      {repositories.isLoading ? (
        <p role="status" className="px-1 py-3 font-display text-body-sm text-mist">
          {copy.loading}
        </p>
      ) : null}
      {repositories.isError ? (
        <div role="alert" className="flex items-center justify-between gap-3 px-1 py-2">
          <p className="font-display text-body-sm text-crimson">
            {apiErrorMessage(repositories.error, "Could not load your repositories.")}
          </p>
          <Button variant="teal" size="sm" onClick={() => void repositories.refetch()}>
            <MaterialIcon name="refresh" className="text-[16px]" />
            {copy.retry}
          </Button>
        </div>
      ) : null}
      {repositories.isSuccess ? (
        <ul className="flex max-h-60 flex-col gap-1 overflow-y-auto pr-1" aria-label={copy.title}>
          {visible.length === 0 ? (
            <li className="px-1 py-3 font-display text-body-sm text-mist">
              {(repositories.data?.data.length ?? 0) === 0 ? copy.none : copy.empty}
            </li>
          ) : null}
          {visible.map((repository) => {
            const selected = sameRepositoryUrl(repository.url, selectedUrl);
            return (
              <li key={repository.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => onPick(repository)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/40 disabled:opacity-50",
                    selected
                      ? "border-ice/50 bg-ice/10"
                      : "border-transparent hover:border-steel/60 hover:bg-panel/60",
                  )}
                >
                  <MaterialIcon
                    name={repository.private ? "lock" : "folder"}
                    className={cn("shrink-0 text-[18px]", repository.private ? "text-champagne" : "text-mist")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-code-md text-foam">
                      {repository.fullName}
                    </span>
                    {repository.description ? (
                      <span className="block truncate font-display text-body-sm text-mist">
                        {repository.description}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 rounded-full bg-surface-high px-2 py-0.5 font-mono text-label-sm text-mist">
                    {repository.defaultBranch}
                  </span>
                  {selected ? (
                    <MaterialIcon name="check_circle" fill className="shrink-0 text-[18px] text-ice" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <p className="px-1 font-mono text-label-sm text-cinder">{copy.orManual}</p>
    </div>
  );
}
