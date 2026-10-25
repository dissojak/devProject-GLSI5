// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { Provider } from "react-redux";
import { DashboardProfileCard } from "@/components/dashboard/session-profile";
import { appStore } from "@/store/store";
import { sessionCleared, sessionStarted } from "@/store/auth-session";

vi.mock("next/link", () => ({
  default: ({ href, className, children, ...rest }: React.ComponentProps<"a"> & { href: string }) =>
    React.createElement("a", { href, className, ...rest }, children),
}));

beforeEach(() => {
  appStore.dispatch(sessionCleared());
});

afterEach(cleanup);

function renderCard() {
  return render(
    <Provider store={appStore}>
      <DashboardProfileCard />
    </Provider>,
  );
}

describe("dashboard profile card", () => {
  it("renders nothing while no session user exists", () => {
    const { container } = renderCard();
    expect(container.textContent).toBe("");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("presents the session user with initials and a title-cased role", () => {
    appStore.dispatch(
      sessionStarted({
        accessToken: "token-1",
        user: { id: "u1", name: "Grace Hopper", email: "grace@example.com", role: "ADMIN" },
      }),
    );
    renderCard();
    expect(screen.getByText("Grace Hopper")).toBeTruthy();
    expect(screen.getByText("GH")).toBeTruthy();
    expect(screen.getByText("Admin")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Log out" }).getAttribute("href")).toBe("/login");
  });

  it("initializes a single-word name from its first letter", () => {
    appStore.dispatch(
      sessionStarted({
        accessToken: "token-2",
        user: { id: "u2", name: "Ada", email: "ada@example.com", role: "DEVELOPER" },
      }),
    );
    renderCard();
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("Developer")).toBeTruthy();
  });
});
