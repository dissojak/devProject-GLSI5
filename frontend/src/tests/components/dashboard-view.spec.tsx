// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { AUTH_SESSION_STORAGE_KEY, ReduxProvider } from "@/store/redux-provider";
import { appStore } from "@/store/store";
import { sessionCleared } from "@/store/auth-session";
import { stubMotionEnvironment } from "@/tests/motion-stubs";

vi.mock("next/link", () => ({
  default: ({ href, className, children }: { href: string; className?: string; children?: React.ReactNode }) =>
    React.createElement("a", { href, className }, children),
}));

beforeAll(() => {
  stubMotionEnvironment();
});

beforeEach(() => {
  window.localStorage.clear();
  appStore.dispatch(sessionCleared());
});

afterEach(cleanup);

afterEach(() => {
  vi.unstubAllGlobals();
});

const SESSION_USER = {
  id: "u1",
  name: "Grace Hopper",
  email: "grace@example.com",
  role: "ADMIN",
};

function signInGrace() {
  window.localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify({ token: "token-1", user: SESSION_USER }),
  );
}

function renderView() {
  return render(
    <ReduxProvider>
      <DashboardView />
    </ReduxProvider>,
  );
}

describe("dashboard view", () => {
  it("greets the signed-in developer by first name", () => {
    signInGrace();
    renderView();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Welcome back, Grace");
    expect(screen.getByText("Manage your projects and prepare their deployments.")).toBeTruthy();
  });

  it("renders the empty workspace telemetry from the mockup", () => {
    signInGrace();
    renderView();
    expect(screen.getByText("Total projects")).toBeTruthy();
    expect(screen.getAllByText("0")).toHaveLength(4);
    expect(screen.getByText("allocated")).toBeTruthy();
    expect(screen.getByText("instances")).toBeTruthy();
    expect(screen.getByText("replicas")).toBeTruthy();
    expect(screen.getByText("active")).toBeTruthy();
    expect(screen.getByText("DP-SYS // IDLE")).toBeTruthy();
    expect(screen.getByText("WORKSPACE: UNALLOCATED")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Create your first project" })).toBeTruthy();
    expect(screen.getByText(/Register an application to start planning/)).toBeTruthy();
    expect(screen.getByText("Zero-trust Blueprint Analysis")).toBeTruthy();
    expect(screen.getByText("Autonomous Topology Inference")).toBeTruthy();
    expect(screen.getByText("Multi-cluster Readiness")).toBeTruthy();
  });

  it("serves no mockup catalog data to a real account", () => {
    signInGrace();
    renderView();
    expect(screen.queryByText("shopflow-store")).toBeNull();
    expect(screen.queryByText("blog-engine")).toBeNull();
    expect(screen.queryByText("12 projects")).toBeNull();
    expect(screen.queryByText("Page 1 of 3")).toBeNull();
    expect(screen.queryByRole("button", { name: "Development" })).toBeNull();
  });

  it("opens the new project modal from the header and empty-place CTAs", async () => {
    signInGrace();
    renderView();
    expect(screen.queryByRole("dialog")).toBeNull();
    const ctaButtons = screen.getAllByRole("button", { name: "New project" });
    expect(ctaButtons).toHaveLength(2);
    fireEvent.click(ctaButtons[0]);
    expect(screen.getByRole("dialog", { name: "New project" })).toBeTruthy();
    expect(screen.getByLabelText(/Project name/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(screen.getAllByRole("button", { name: "New project" })[1]);
    expect(screen.getByRole("dialog", { name: "New project" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("does not flag a conflict while the catalog is empty", () => {
    signInGrace();
    renderView();
    fireEvent.click(screen.getAllByRole("button", { name: "New project" })[0]);
    fireEvent.change(screen.getByLabelText(/Project name/), {
      target: { value: "shopflow-store" },
    });
    expect(screen.queryByText("Conflict Check Preview")).toBeNull();
  });

  it("closes the modal through the creation submit seam", async () => {
    signInGrace();
    renderView();
    fireEvent.click(screen.getAllByRole("button", { name: "New project" })[0]);
    fireEvent.change(screen.getByLabelText(/Project name/), {
      target: { value: "waveform-api" },
    });
    const dialog = screen.getByRole("dialog");
    const form = dialog.querySelector("form");
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("modal form is missing");
    }
    fireEvent.submit(form);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
