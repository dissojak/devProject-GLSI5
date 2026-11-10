// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeploymentsBoard } from "@/components/pipeline/deployments-board";
import {
  PROJECT_ROW,
  deploymentOf,
  grantSession,
  listHandler,
  renderBoard,
  resetBoardEnvironment,
  stubPipelineEndpoints,
} from "@/tests/pipeline-stubs";
import { appStore } from "@/store/store";
import { sessionExpired } from "@/store/auth-session";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("next/link", () => ({
  default: ({ href, className, children, ...rest }: React.ComponentProps<"a"> & { href: string }) =>
    React.createElement("a", { href, className, ...rest }, children),
}));

const baseHandlers = (rows: ReturnType<typeof deploymentOf>[]) => [
  listHandler("deployments", rows),
  listHandler("projects", [PROJECT_ROW]),
];

afterEach(() => {
  resetBoardEnvironment();
  replace.mockClear();
});

beforeEach(() => {
  resetBoardEnvironment();
});

describe("deployments board", () => {
  it("renders the stage sheet with environment accents and argo chips", async () => {
    stubPipelineEndpoints(
      baseHandlers([
        deploymentOf("IN_PROGRESS", {
          argo: {
            applicationName: "atlas-api",
            syncStatus: "SYNCED",
            healthStatus: "HEALTHY",
            lastSyncedAt: null,
          },
          startedAt: "2026-11-10T12:01:00.000Z",
        }),
      ]),
    );
    grantSession();
    renderBoard(<DeploymentsBoard />);

    expect(await screen.findByText("Stage 03")).toBeTruthy();
    expect(screen.getByText("Rollout")).toBeTruthy();
    expect(await screen.findByText("Atlas")).toBeTruthy();
    expect(screen.getByText("Production")).toBeTruthy();
    expect(screen.getByText("IN PROGRESS")).toBeTruthy();
    expect(screen.getByText("atlas-api")).toBeTruthy();
    expect(screen.getAllByText("SYNCED").length).toBeGreaterThan(0);
    expect(screen.getAllByText("HEALTHY").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Cancel deployment" })).toBeTruthy();
  });

  it("hides the cancel action behind terminal statuses", async () => {
    stubPipelineEndpoints(
      baseHandlers([
        deploymentOf("SUCCEEDED", { durationMs: 95_000 }),
        deploymentOf("FAILED", {
          id: "dep_2",
          environment: "STAGING",
          error: { code: "ARGO_SYNC_FAILED", message: "the application never synced" },
        }),
      ]),
    );
    grantSession();
    renderBoard(<DeploymentsBoard />);

    expect(await screen.findByText("SUCCEEDED")).toBeTruthy();
    expect(screen.getByText("1m 35s")).toBeTruthy();
    expect(screen.getByText("the application never synced")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Cancel deployment" })).toBeNull();
  });

  it("cancels a live deployment and confirms with a champagne toast", async () => {
    let cancelled = false;
    stubPipelineEndpoints([
      ...baseHandlers([deploymentOf("PENDING")]),
      {
        match: (method, path) => {
          if (method !== "POST") return false;
          if (path.endsWith("/cancel")) {
            cancelled = true;
            return true;
          }
          return false;
        },
        payload: () => ({ message: "ok", data: deploymentOf("CANCELLED") }),
        status: 200,
      },
    ]);
    grantSession();
    renderBoard(<DeploymentsBoard />);
    fireEvent.click(await screen.findByRole("button", { name: "Cancel deployment" }));

    expect(await screen.findByText("Deployment cancelled")).toBeTruthy();
    expect(cancelled).toBe(true);
  });

  it("surfaces the backend copy when the cancel fails", async () => {
    stubPipelineEndpoints([
      ...baseHandlers([deploymentOf("PENDING")]),
      {
        match: (method, path) => method === "POST" && path.endsWith("/cancel"),
        payload: () => ({
          error: { code: "CONFLICT", message: "The rollout already reached the cluster." },
        }),
        status: 409,
      },
    ]);
    grantSession();
    renderBoard(<DeploymentsBoard />);
    fireEvent.click(await screen.findByRole("button", { name: "Cancel deployment" }));

    expect(await screen.findByText("The rollout already reached the cluster.")).toBeTruthy();
    expect(screen.queryByText(/CONFLICT/i)).toBeNull();
  });

  it("filters the loaded page by status without refetching", async () => {
    const fetchMock = stubPipelineEndpoints(
      baseHandlers([
        deploymentOf("SUCCEEDED", { durationMs: 95_000 }),
        deploymentOf("PENDING", { id: "dep_2", environment: "DEVELOPMENT" }),
      ]),
    );
    grantSession();
    renderBoard(<DeploymentsBoard />);
    await screen.findByText("SUCCEEDED");

    fireEvent.click(screen.getByRole("button", { name: /Pending/ }));
    expect(await screen.findByText("PENDING")).toBeTruthy();
    expect(screen.queryByText("SUCCEEDED")).toBeNull();
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it("points an empty board at the plan stage", async () => {
    stubPipelineEndpoints(baseHandlers([]));
    grantSession();
    renderBoard(<DeploymentsBoard />);

    expect(await screen.findByText("No deployments yet")).toBeTruthy();
    expect(screen.getByText("Go to plans")).toBeTruthy();
  });

  it("redirects anonymous visitors through the session gate", async () => {
    stubPipelineEndpoints(baseHandlers([deploymentOf("PENDING")]));
    grantSession();
    renderBoard(<DeploymentsBoard />);
    await waitFor(() => expect(screen.getByText("Stage 03")).toBeTruthy());
    appStore.dispatch(sessionExpired());
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});
