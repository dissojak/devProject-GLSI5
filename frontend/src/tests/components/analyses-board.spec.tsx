// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalysesBoard } from "@/components/pipeline/analyses-board";
import {
  ANALYSIS_ROW,
  PROJECT_ROW,
  callsOf,
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

afterEach(() => {
  resetBoardEnvironment();
  replace.mockClear();
});

beforeEach(() => {
  resetBoardEnvironment();
});

describe("analyses board", () => {
  it("redirects anonymous visitors through the session gate before data loads", async () => {
    stubPipelineEndpoints([listHandler("analyses", [ANALYSIS_ROW]), listHandler("projects", [PROJECT_ROW])]);
    grantSession();
    renderBoard(<AnalysesBoard />);
    await screen.findByText("Stage 01");
    appStore.dispatch(sessionExpired());
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("renders the stage sheet: eyebrow, tally strip, and the loaded rows", async () => {
    stubPipelineEndpoints([listHandler("analyses", [ANALYSIS_ROW]), listHandler("projects", [PROJECT_ROW])]);
    grantSession();
    renderBoard(<AnalysesBoard />);

    expect(await screen.findByText("Stage 01")).toBeTruthy();
    expect(screen.getByText("Evidence")).toBeTruthy();
    expect(await screen.findByText("Atlas")).toBeTruthy();
    expect(screen.getByText("#7")).toBeTruthy();
    expect(screen.getByText("COMPLETED")).toBeTruthy();
    // The strip doubles as the page census: All + Completed each count 1.
    expect(screen.getByText("All")).toBeTruthy();
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(2);
  });

  it("filters the loaded page client-side without refetching", async () => {
    const fetchMock = stubPipelineEndpoints([
      listHandler("analyses", [ANALYSIS_ROW, { ...ANALYSIS_ROW, id: "ana_2", status: "RUNNING", number: 8 }]),
      listHandler("projects", [PROJECT_ROW]),
    ]);
    grantSession();
    renderBoard(<AnalysesBoard />);
    await screen.findAllByText("Atlas");

    fireEvent.click(screen.getByRole("button", { name: /Running/ }));
    expect(await screen.findByText("RUNNING")).toBeTruthy();
    expect(screen.queryByText("COMPLETED")).toBeNull();
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it("shows the planner error sheet and recovers through Try again", async () => {
    let failing = true;
    const fetchMock = stubPipelineEndpoints([
      {
        match: (method, path) => method === "GET" && path.endsWith("/analyses"),
        payload: () =>
          failing
            ? { error: { code: "SERVICE_UNAVAILABLE", message: "Service paused." } }
            : {
                message: "ok",
                data: [ANALYSIS_ROW],
                pagination: { page: 1, limit: 50, total: 1, pageCount: 1 },
              },
        get status() {
          return failing ? 503 : 200;
        },
      },
      listHandler("projects", [PROJECT_ROW]),
    ]);
    grantSession();
    renderBoard(<AnalysesBoard />);

    expect(await screen.findByText("Analyses unreachable")).toBeTruthy();
    expect(screen.getByText("Service paused.")).toBeTruthy();
    expect(screen.queryByText(/SERVICE_UNAVAILABLE/i)).toBeNull();

    failing = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Atlas")).toBeTruthy();
    expect(callsOf(fetchMock).filter((call) => call.method === "GET" && call.path.endsWith("/analyses")).length).toBeGreaterThanOrEqual(2);
  });

  it("invites the first scan when the board is empty", async () => {
    stubPipelineEndpoints([listHandler("analyses", []), listHandler("projects", [])]);
    grantSession();
    renderBoard(<AnalysesBoard />);

    expect(await screen.findByText("No analyses yet")).toBeTruthy();
    expect(screen.getByText("Go to projects")).toBeTruthy();
  });

  it("stands in with a truncated id when a project is outside the name cache", async () => {
    stubPipelineEndpoints([listHandler("analyses", [ANALYSIS_ROW]), listHandler("projects", [])]);
    grantSession();
    renderBoard(<AnalysesBoard />);

    expect(await screen.findByText("#prj_1")).toBeTruthy();
  });

  it("drafts the plan v1 from a COMPLETED row and confirms through a toast", async () => {
    const fetchMock = stubPipelineEndpoints([
      listHandler("analyses", [ANALYSIS_ROW]),
      listHandler("projects", [PROJECT_ROW]),
      {
        match: (method, path) => method === "POST" && path.endsWith("/plans"),
        payload: () => ({ message: "created", data: { id: "pln_9", status: "DRAFT" } }),
        status: 201,
      },
    ]);
    grantSession();
    renderBoard(<AnalysesBoard />);

    fireEvent.click(await screen.findByRole("button", { name: /Draft plan/ }));

    expect(await screen.findByText("Plan draft created")).toBeTruthy();

    const draftCall = callsOf(fetchMock).find(
      (call) => call.method === "POST" && call.path.endsWith("/plans"),
    );
    expect(draftCall).toBeTruthy();
    const body = JSON.parse(
      await (fetchMock.mock.calls[draftCall!.index][0] as Request).clone().text(),
    );
    expect(body).toEqual({ projectId: "prj_1", analysisId: "ana_1" });
  });

  it("reports a failed draft through the failed toast with the server message", async () => {
    stubPipelineEndpoints([
      listHandler("analyses", [ANALYSIS_ROW]),
      listHandler("projects", [PROJECT_ROW]),
      {
        match: (method, path) => method === "POST" && path.endsWith("/plans"),
        payload: () => ({
          error: { code: "CONFLICT", message: "Only a completed analysis can produce a plan draft" },
        }),
        status: 409,
      },
    ]);
    grantSession();
    renderBoard(<AnalysesBoard />);

    fireEvent.click(await screen.findByRole("button", { name: /Draft plan/ }));

    expect(await screen.findByText("Action failed")).toBeTruthy();
    expect(
      await screen.findByText("Only a completed analysis can produce a plan draft"),
    ).toBeTruthy();
  });

  it("offers no action while the analysis is still moving", async () => {
    stubPipelineEndpoints([
      listHandler("analyses", [{ ...ANALYSIS_ROW, id: "ana_2", status: "RUNNING", number: 8 }]),
      listHandler("projects", [PROJECT_ROW]),
    ]);
    grantSession();
    renderBoard(<AnalysesBoard />);

    await screen.findByText("RUNNING");
    expect(screen.queryByRole("button", { name: /Draft plan/ })).toBeNull();
  });
});
