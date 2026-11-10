// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlansBoard } from "@/components/pipeline/plans-board";
import {
  PROJECT_ROW,
  callsOf,
  grantSession,
  listHandler,
  planOf,
  renderBoard,
  resetBoardEnvironment,
  stubPipelineEndpoints,
} from "@/tests/pipeline-stubs";
import type { DeploymentPlan } from "@/types/plan";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("next/link", () => ({
  default: ({ href, className, children, ...rest }: React.ComponentProps<"a"> & { href: string }) =>
    React.createElement("a", { href, className, ...rest }, children),
}));

const baseHandlers = (rows: DeploymentPlan[]) => [
  listHandler("plans", rows),
  listHandler("projects", [PROJECT_ROW]),
];

afterEach(() => {
  resetBoardEnvironment();
  replace.mockClear();
});

beforeEach(() => {
  resetBoardEnvironment();
});

describe("plans board", () => {
  it("renders the stage sheet with draft rows and their registry actions", async () => {
    stubPipelineEndpoints(baseHandlers([planOf("DRAFT")]));
    grantSession();
    renderBoard(<PlansBoard />);

    expect(await screen.findByText("Stage 02")).toBeTruthy();
    expect(screen.getByText("Contract")).toBeTruthy();
    expect(await screen.findByText("Atlas")).toBeTruthy();
    expect(screen.getByText("v2")).toBeTruthy();
    expect(screen.getByText("DRAFT")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Show plan details" }));
    expect(await screen.findByText("api")).toBeTruthy();
    expect(screen.getByText("BACKEND")).toBeTruthy();
    expect(screen.getByText("HPA 2–6 @ 70%")).toBeTruthy();
    expect(screen.getByText(/api\.atlas\.dev/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Approve" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reject" })).toBeTruthy();
  });

  it("approves a draft and confirms with a mint toast", async () => {
    const posts: { path: string; body: unknown }[] = [];
    stubPipelineEndpoints([
      ...baseHandlers([planOf("DRAFT")]),
      {
        match: (method, path) => {
          if (method !== "POST") return false;
          posts.push({ path, body: undefined });
          return path.endsWith("/approve");
        },
        payload: () => ({ message: "ok", data: planOf("APPROVED") }),
        status: 200,
      },
    ]);
    grantSession();
    renderBoard(<PlansBoard />);
    fireEvent.click(await screen.findByRole("button", { name: "Show plan details" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(await screen.findByText("Plan approved")).toBeTruthy();
    expect(posts.some((post) => post.path.endsWith("/approve"))).toBe(true);
  });

  it("opens the rejection form in the sheet and submits the typed reason", async () => {
    const fetchMock = stubPipelineEndpoints([
      ...baseHandlers([planOf("DRAFT")]),
      {
        match: (method, path) => method === "POST" && path.endsWith("/reject"),
        payload: () => ({ message: "ok", data: planOf("REJECTED") }),
        status: 200,
      },
    ]);
    grantSession();
    renderBoard(<PlansBoard />);
    fireEvent.click(await screen.findByRole("button", { name: "Show plan details" }));
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));

    expect(await screen.findByText("Rejection reason")).toBeTruthy();

    // Empty reason is refused inline, before any mutation is fired.
    fireEvent.click(screen.getByRole("button", { name: "Confirm rejection" }));
    expect(await screen.findByText("A rejection reason is required")).toBeTruthy();
    expect(
      fetchMock.mock.calls.filter(([, init]) => String((init as RequestInit | undefined)?.method) === "POST"),
    ).toHaveLength(0);

    fireEvent.change(screen.getByLabelText("Rejection reason"), {
      target: { value: "replicas are too low" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm rejection" }));

    expect(await screen.findByText("Plan rejected")).toBeTruthy();
    const rejectCall = callsOf(fetchMock).find(
      (call) => call.method === "POST" && call.path.endsWith("/reject"),
    );
    const requestBody = JSON.parse(
      await (fetchMock.mock.calls[rejectCall?.index ?? -1]?.[0] as Request).clone().text(),
    );
    expect(requestBody).toEqual({ reason: "replicas are too low" });
  });

  it("cancels the rejection form without firing a mutation", async () => {
    const fetchMock = stubPipelineEndpoints(baseHandlers([planOf("DRAFT")]));
    grantSession();
    renderBoard(<PlansBoard />);
    fireEvent.click(await screen.findByRole("button", { name: "Show plan details" }));
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(await screen.findByText("Rejection reason")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Rejection reason")).toBeNull();

    await waitFor(() =>
      expect(callsOf(fetchMock).filter((call) => call.method === "POST")).toHaveLength(0),
    );
  });

  it("offers the deploy targets to approved plans and requests the rollout", async () => {
    const requested: string[] = [];
    stubPipelineEndpoints([
      ...baseHandlers([planOf("APPROVED")]),
      {
        match: (method, path) => {
          if (method !== "POST") return false;
          if (path.endsWith("/deployments")) {
            requested.push(path);
            return true;
          }
          return false;
        },
        payload: () => ({ message: "ok", data: { id: "dep_1" } }),
        status: 201,
      },
    ]);
    grantSession();
    renderBoard(<PlansBoard />);
    fireEvent.click(await screen.findByRole("button", { name: "Show plan details" }));

    expect(screen.getByText("APPROVED")).toBeTruthy();
    expect(screen.getByText("Deploy to")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Production" }));
    expect(await screen.findByText("Deployment requested")).toBeTruthy();
    expect(requested[0].endsWith("/plans/pln_1/deployments")).toBe(true);
  });

  it("retires superseded plans without any actions", async () => {
    stubPipelineEndpoints(baseHandlers([planOf("SUPERSEDED")]));
    grantSession();
    renderBoard(<PlansBoard />);
    fireEvent.click(await screen.findByRole("button", { name: "Show plan details" }));

    expect(await screen.findByText("SUPERSEDED")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reject" })).toBeNull();
    expect(screen.queryByText("Deploy to")).toBeNull();
  });

  it("invites the first plan when the board is empty", async () => {
    stubPipelineEndpoints(baseHandlers([]));
    grantSession();
    renderBoard(<PlansBoard />);

    expect(await screen.findByText("No plans yet")).toBeTruthy();
    expect(screen.getByText("Go to projects")).toBeTruthy();
  });
});
