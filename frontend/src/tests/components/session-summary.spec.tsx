// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { Provider } from "react-redux";
import { SessionSummary } from "@/components/auth/session-summary";
import { appStore } from "@/store/store";
import { sessionCleared, sessionRestored } from "@/store/auth-session";
import type { AuthAccount } from "@/types/auth";

const mockRouter = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("next/link", () => ({
  default: ({ href, className, children }: { href: string; className?: string; children?: React.ReactNode }) =>
    React.createElement("a", { href, className }, children),
}));

afterEach(cleanup);
afterEach(() => {
  vi.unstubAllGlobals();
  appStore.dispatch(sessionCleared());
  mockRouter.replace.mockClear();
  window.history.replaceState(null, "", "/");
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

describe("SessionSummary finishing a GitHub handoff", () => {
  it("starts the redux session from the URL fragment handoff", () => {
    window.history.replaceState(
      null,
      "",
      "/session#access_token=token-gh&user_id=u1&user_name=Ada Lovelace&user_email=ada%40example.com&user_role=DEVELOPER",
    );
    renderSummary();

    expect(appStore.getState().authSession).toEqual({
      token: "token-gh",
      user: ADA,
    });
    expect(mockRouter.replace).toHaveBeenCalledWith("/session");
  });

  it("stays signed-in-free and flags a corrupted handoff fragment", () => {
    window.history.replaceState(null, "", "/session#access_token=");
    renderSummary();

    expect(appStore.getState().authSession.token).toBeNull();
    expect(
      screen.getByText("Something went wrong. Please try again."),
    ).toBeDefined();
    expect(screen.getByText("You are not signed in.")).toBeDefined();
  });
});

describe("SessionSummary logout", () => {
  it("revokes the session on the backend and clears the local store", async () => {
    const fetchMock = vi.fn(
      () =>
        Promise.resolve(new Response(JSON.stringify({ message: "Logged out successfully" }), { status: 200 })),
    );
    vi.stubGlobal("fetch", fetchMock);
    appStore.dispatch(sessionRestored({ token: "token-9", user: ADA }));
    renderSummary();

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(appStore.getState().authSession.token).toBeNull();
    });
    expect(appStore.getState().authSession.user).toBeNull();
    expect(mockRouter.replace).toHaveBeenCalledWith("/");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/auth/logout",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-9",
        },
      },
    );
  });

  it("clears the local session even when the backend refuses the logout", async () => {
    const fetchMock = vi.fn(
      () =>
        Promise.resolve(new Response(JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "boom" } }), { status: 500 })),
    );
    vi.stubGlobal("fetch", fetchMock);
    appStore.dispatch(sessionRestored({ token: "token-9", user: ADA }));
    renderSummary();

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(appStore.getState().authSession.token).toBeNull();
    });
    expect(mockRouter.replace).not.toHaveBeenCalledWith("/");
    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeDefined();
    expect(screen.getByText("You are not signed in.")).toBeDefined();
  });
});
