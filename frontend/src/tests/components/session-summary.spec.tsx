// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { Provider } from "react-redux";
import { SessionSummary } from "@/components/auth/session-summary";
import { appStore } from "@/store/store";
import { sessionCleared, sessionRestored } from "@/store/auth-session";
import type { AuthAccount } from "@/types/auth";

vi.mock("next/link", () => ({
  default: ({ href, className, children }: { href: string; className?: string; children?: React.ReactNode }) =>
    React.createElement("a", { href, className }, children),
}));

afterEach(cleanup);
afterEach(() => {
  appStore.dispatch(sessionCleared());
});

const ADA: AuthAccount = {
  id: "u1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "DEVELOPER",
};

function renderSummary() {
  return render(
    <Provider store={appStore}>
      <SessionSummary />
    </Provider>,
  );
}

describe("SessionSummary", () => {
  it("shows the not-signed-in state when the session is empty", () => {
    renderSummary();

    expect(screen.getByText("You are not signed in.")).toBeDefined();
    expect(screen.getByText("Back to login").getAttribute("href")).toBe("/");
  });

  it("lists the signed-in account and its token", () => {
    appStore.dispatch(sessionRestored({ token: "token-9", user: ADA }));
    renderSummary();

    expect(screen.getByText("You are signed in")).toBeDefined();
    expect(screen.getByText("Name")).toBeDefined();
    expect(screen.getByText("Ada Lovelace")).toBeDefined();
    expect(screen.getByText("Email")).toBeDefined();
    expect(screen.getByText("ada@example.com")).toBeDefined();
    expect(screen.getByText("Role")).toBeDefined();
    expect(screen.getByText("DEVELOPER")).toBeDefined();
    expect(screen.getByText("Access token")).toBeDefined();
    expect(screen.getByTitle("token-9").textContent).toBe("token-9");
  });
});
