
"use client";

import { useState } from "react";

import { Button } from "@/shared/button";

import {
  useListKubernetesDeploymentHistoryQuery,
  type KubernetesAttemptStatus,
} from "@/store/kubernetes-deployment-history-api";

interface KubernetesDeploymentHistoryProps {
  projectId: string;
  planId: string;
  approved: boolean;
}

const STATUS_LABELS: Record<
  KubernetesAttemptStatus,
  string
> = {
  STARTED: "In progress",
  APPLIED: "Applied",
  FAILED: "Failed",
};

const STATUS_CLASSES: Record<
  KubernetesAttemptStatus,
  string
> = {
  STARTED:
    "border-champagne/40 bg-champagne/10 text-champagne",
  APPLIED:
    "border-mint/40 bg-mint/10 text-mint",
  FAILED:
    "border-crimson/40 bg-crimson/10 text-crimson",
};

function formatDate(value?: string): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString("fr-FR");
}

export function KubernetesDeploymentHistory({
  projectId,
  planId,
  approved,
}: KubernetesDeploymentHistoryProps) {
  const [page, setPage] = useState(1);

  const query = useListKubernetesDeploymentHistoryQuery(
    {
      projectId,
      planId,
      page,
      limit: 10,
    },
    {
      skip: !approved,
    },
  );

  const attempts = query.data?.data ?? [];

  const pagination = query.data?.pagination;

  return (
    <section className="mt-6 rounded-2xl border border-steel bg-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-headline-sm font-semibold text-foam">
            Deployment History
          </h3>

          <p className="mt-2 max-w-xl text-body-sm text-mist">
            Previous Kubernetes deployment attempts
            stored in MongoDB.
          </p>
        </div>

        <Button
          variant="teal"
          disabled={!approved || query.isFetching}
          onClick={() => {
            void query.refetch();
          }}
          className="min-h-10 px-5"
        >
          {query.isFetching
            ? "Refreshing..."
            : "Refresh history"}
        </Button>
      </div>

      {!approved ? (
        <p className="mt-5 text-body-sm text-champagne">
          An approved plan is required to view
          Kubernetes deployment history.
        </p>
      ) : null}

      {query.isLoading ? (
        <p
          role="status"
          className="mt-5 text-body-sm text-mist"
        >
          Loading deployment history...
        </p>
      ) : null}

      {query.isError ? (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-crimson/40 bg-crimson/10 p-4"
        >
          <p className="text-body-sm text-crimson">
            Unable to load deployment history.
            Verify the backend route and MongoDB connection.
          </p>
        </div>
      ) : null}

      {query.isSuccess &&
      attempts.length === 0 ? (
        <p className="mt-5 rounded-xl border border-steel/50 bg-basin p-4 text-body-sm text-mist">
          No deployment attempts have been recorded
          for this plan.
        </p>
      ) : null}

      {attempts.length > 0 ? (
        <div className="mt-5 space-y-4">
          {attempts.map((attempt) => (
            <article
              key={attempt.id}
              className="rounded-xl border border-steel/50 bg-basin p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-display text-body-md font-semibold text-foam">
                    Deployment Plan v{attempt.planVersion}
                  </h4>

                  <p className="mt-1 text-label-sm text-mist">
                    {formatDate(attempt.startedAt)}
                  </p>
                </div>

                <span
                  className={
                    "rounded-full border px-3 py-1 text-label-sm " +
                    STATUS_CLASSES[attempt.status]
                  }
                >
                  {STATUS_LABELS[attempt.status]}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-label-sm text-mist">
                    Cluster
                  </p>

                  <p className="mt-1 text-body-sm text-foam">
                    {attempt.cluster}
                  </p>
                </div>

                <div>
                  <p className="text-label-sm text-mist">
                    Namespace
                  </p>

                  <p className="mt-1 text-body-sm text-foam">
                    {attempt.namespace}
                  </p>
                </div>

                <div>
                  <p className="text-label-sm text-mist">
                    Started
                  </p>

                  <p className="mt-1 text-body-sm text-foam">
                    {formatDate(attempt.startedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-label-sm text-mist">
                    Finished
                  </p>

                  <p className="mt-1 text-body-sm text-foam">
                    {formatDate(attempt.finishedAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-label-sm text-mist">
                  Triggered by
                </p>

                <p className="mt-1 break-all font-mono text-code-sm text-foam">
                  {attempt.triggeredBy}
                </p>
              </div>

              {attempt.output ? (
                <div className="mt-4">
                  <p className="text-body-sm font-semibold text-foam">
                    Kubernetes output
                  </p>

                  <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-steel/40 bg-abyss p-3 font-mono text-code-sm text-ice">
                    {attempt.output}
                  </pre>
                </div>
              ) : null}

              {attempt.errorMessage ? (
                <div
                  role="alert"
                  className="mt-4 rounded-lg border border-crimson/40 bg-crimson/10 p-3"
                >
                  <p className="text-body-sm font-semibold text-crimson">
                    Deployment error
                  </p>

                  <p className="mt-2 whitespace-pre-wrap break-words text-body-sm text-crimson">
                    {attempt.errorMessage}
                  </p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      {pagination && pagination.total > 0 ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-body-sm text-mist">
            Page {pagination.page} of{" "}
            {Math.max(1, pagination.pageCount)}
            {" · "}
            {pagination.total} deployment attempts
          </p>

          <div className="flex gap-3">
            <Button
              variant="teal"
              disabled={
                page <= 1 ||
                query.isFetching
              }
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1),
                )
              }
              className="min-h-9 px-4"
            >
              Previous
            </Button>

            <Button
              variant="teal"
              disabled={
                page >= pagination.pageCount ||
                query.isFetching
              }
              onClick={() =>
                setPage((current) =>
                  current + 1,
                )
              }
              className="min-h-9 px-4"
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
