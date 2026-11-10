// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { Provider } from "react-redux";
import { ProfilePage } from "@/components/profile/profile-page";
import { ToastProvider } from "@/components/toast/toast-provider";
import { appStore } from "@/store/store";
import { apiSlice } from "@/store/api";
import { sessionCleared, sessionExpired, sessionStarted } from "@/store/auth-session";
import { stubMotionEnvironment } from "@/tests/motion-stubs";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("next/link", () => ({
  default: ({ href, className, children, ...rest }: React.ComponentProps<"a"> & { href: string }) =>
    React.createElement("a", { href, className, ...rest }, children),
}));

const PROFILE_USER = {
  id: "usr_1",
  name: "DissoJak",
  email: "dissojak@example.com",
  role: "DEVELOPER",
  avatarUrl: null,
  lastLoginAt: "2026-11-10T10:00:00.000Z",
};

const SAVED_USER = { ...PROFILE_USER, name: "DissoJak Senior" };

type StubHandler = {
  match: (method: "GET" | "PATCH" | "POST", path: string) => boolean;
  payload: () => unknown;
  ok: boolean;
  status: number;
};

/** RTKQ wires a Request object + clones the response before reading `text()`. */
function json(status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  const response = {
    ok: status < 400,
    status,
    json: () => Promise.resolve(payload),
    text: () => Promise.resolve(body),
  };
  return { ...response, clone: () => json(status, payload) };
}

function asRequest(input: unknown, init?: RequestInit): { url: string; method: string } {
  if (input instanceof Request) {
    return { url: input.url, method: input.method.toUpperCase() };
  }
  return { url: String(input), method: ((init?.method as string) ?? "GET").toUpperCase() };
}

function stubProfileEndpoint(handlers: StubHandler[]) {
  const fetchMock = vi.fn((input: unknown, init?: RequestInit) => {
    const request = asRequest(input, init);
    const path = request.url.replace(/^https?:\/\/[^/]+/, "");
    const handler = handlers.find((entry) =>
      entry.match(request.method as "GET" | "PATCH" | "POST", path),
    );
    if (!handler) return json(200, { message: "ok", data: null });
    return json(handler.status, handler.payload());
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function profileHandlers(data: unknown, extra: StubHandler[] = []) {
  return [
    {
      match: (
        method: "GET" | "PATCH" | "POST",
        path: string,
      ) => method === "GET" && path.endsWith("/profile"),
      payload: () => ({ message: "ok", data }),
      ok: true,
      status: 200,
    },
    ...extra,
  ];
}

function killPendingFetch() {
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
}

function renderProfile() {
  return render(
    <Provider store={appStore}>
      <ToastProvider>
        <ProfilePage />
      </ToastProvider>
    </Provider>,
  );
}

afterEach(cleanup);

beforeAll(() => {
  stubMotionEnvironment();
});

beforeEach(() => {
  // Hermetic: always reset query state and never touch the local dev backend.
  appStore.dispatch(sessionCleared());
  appStore.dispatch(apiSlice.util.resetApiState());
  killPendingFetch();
  replace.mockClear();
});

describe("profile page", () => {
  it("redirects anonymous visitors through the session gate before data loads", async () => {
    // sessionExpired == hydrated with no token: exactly the gated-out state.
    appStore.dispatch(sessionExpired());
    renderProfile();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("renders the skeleton while /profile resolves, then the identity readout", async () => {
    stubProfileEndpoint(profileHandlers(PROFILE_USER));
    appStore.dispatch(sessionStarted({ accessToken: "token-1", user: PROFILE_USER }));
    renderProfile();
    await waitFor(() => expect(screen.getAllByText("Profile").length).toBeGreaterThan(0));
    expect(await screen.findByText("DissoJak")).toBeTruthy();
    expect((screen.getByDisplayValue("dissojak@example.com") as HTMLInputElement).disabled).toBe(
      true,
    );
    expect(screen.getByText("Change your password to keep your account secure.")).toBeTruthy();
    const save = screen.getByRole("button", { name: "Save changes" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
  });

  it("walks pristine → buggy name → invalid → saved, with state hints and a mint toast", async () => {
    let saved = false;
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: unknown, init?: RequestInit) => {
        const request = asRequest(input, init);
        callCount += 1;
        if (request.method === "PATCH") {
          saved = true;
          return json(200, { message: "ok", data: SAVED_USER });
        }
        return json(200, { message: "ok", data: saved ? SAVED_USER : PROFILE_USER });
      }),
    );
    appStore.dispatch(sessionStarted({ accessToken: "token-1", user: PROFILE_USER }));
    renderProfile();
    const nameInput = (await screen.findByDisplayValue("DissoJak")) as HTMLInputElement;
    const saveButton = () => screen.getByRole("button", { name: "Save changes" }) as HTMLButtonElement;

    fireEvent.change(nameInput, { target: { value: "D" } });
    await waitFor(() =>
      expect(screen.getByText("Form invalid: resolve payload errors")).toBeTruthy(),
    );
    expect(saveButton().disabled).toBe(true);

    fireEvent.change(nameInput, { target: { value: "DissoJak Senior" } });
    await waitFor(() => expect(screen.getByText("Unsaved parameter delta")).toBeTruthy());
    expect(saveButton().disabled).toBe(false);

    fireEvent.click(saveButton());
    await waitFor(() => expect(callCount).toBeGreaterThan(1));
    expect(await screen.findByText("Profile updated")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("All changes saved")).toBeTruthy());
  });

  it("surfaces a backend PATCH failure without leaking error codes", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        calls += 1;
        if (calls === 1) {
          return json(200, { message: "ok", data: PROFILE_USER });
        }
        return json(500, {
          error: { code: "INTERNAL_ERROR", message: "Could not save the profile." },
        });
      }),
    );
    appStore.dispatch(sessionStarted({ accessToken: "token-1", user: PROFILE_USER }));
    renderProfile();
    const nameInput = (await screen.findByDisplayValue("DissoJak")) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "DissoJak Senior" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.getByText("Could not save the profile.")).toBeTruthy());
    expect(screen.queryByText(/INTERNAL_ERROR/i)).toBeNull();
  });

  it("shows the load-failure state and recovers through Try again", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        json(503, { error: { code: "SERVICE_UNAVAILABLE", message: "Service paused." } }),
      )
      .mockResolvedValue(json(200, { message: "ok", data: PROFILE_USER }));
    vi.stubGlobal("fetch", fetchMock);
    appStore.dispatch(sessionStarted({ accessToken: "token-1", user: PROFILE_USER }));
    renderProfile();
    expect(await screen.findByText("We couldn't load your profile")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByDisplayValue("DissoJak")).toBeTruthy();
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("expands the password module through the security row and rotates the password", async () => {
    stubProfileEndpoint([
      ...profileHandlers(PROFILE_USER),
      {
        match: (method, path) => method === "POST" && path.endsWith("/profile/password"),
        payload: () => ({ message: "ok", data: null }),
        ok: true,
        status: 200,
      },
    ]);
    appStore.dispatch(sessionStarted({ accessToken: "token-1", user: PROFILE_USER }));
    renderProfile();
    fireEvent.click(
      await screen.findByRole("button", { name: "Change password" }),
    );
    const currentInput = (await screen.findByLabelText("Current password")) as HTMLInputElement;
    const nextInput = screen.getByLabelText("New password") as HTMLInputElement;
    const confirmInput = screen.getByLabelText("Confirm new password") as HTMLInputElement;
    const update = () => screen.getByRole("button", { name: "Update password" }) as HTMLButtonElement;

    // New password identical to current — inline reuse copy from state B.
    fireEvent.change(currentInput, { target: { value: "Passw0rd!" } });
    fireEvent.change(nextInput, { target: { value: "Passw0rd!" } });
    fireEvent.change(confirmInput, { target: { value: "Passw0rd!" } });
    expect(
      await screen.findByText("New password must be different from your current password."),
    ).toBeTruthy();
    expect(update().disabled).toBe(true);

    // Fresh strong pair unlocks the commit.
    fireEvent.change(nextInput, { target: { value: "Fresh1Password!" } });
    fireEvent.change(confirmInput, { target: { value: "Fresh1Password!" } });
    await waitFor(() => expect(update().disabled).toBe(false));
    expect(screen.getByText("Strong · 4 of 4 met")).toBeTruthy();

    fireEvent.click(update());
    await waitFor(() => expect(screen.getByText("Password updated")).toBeTruthy());
    await waitFor(() =>
      expect(screen.getByText("Change your password to keep your account secure.")).toBeTruthy(),
    );
  });

  it("keeps the form open and shows the backend copy when the current password is wrong", async () => {
    stubProfileEndpoint([
      ...profileHandlers(PROFILE_USER),
      {
        match: (method, path) => method === "POST" && path.endsWith("/profile/password"),
        payload: () => ({
          error: { code: "FORBIDDEN", message: "Current password is incorrect." },
        }),
        ok: false,
        status: 403,
      },
    ]);
    appStore.dispatch(sessionStarted({ accessToken: "token-1", user: PROFILE_USER }));
    renderProfile();
    fireEvent.click(await screen.findByRole("button", { name: "Change password" }));
    fireEvent.change((await screen.findByLabelText("Current password")) as HTMLInputElement, {
      target: { value: "WrongWrong1!" },
    });
    fireEvent.change((screen.getByLabelText("New password") as HTMLInputElement), {
      target: { value: "Fresh1Password!" },
    });
    fireEvent.change((screen.getByLabelText("Confirm new password") as HTMLInputElement), {
      target: { value: "Fresh1Password!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect(await screen.findByText("Authentication failed")).toBeTruthy();
    expect(await screen.findByText("Current password is incorrect.")).toBeTruthy();
    expect(screen.queryByText(/FORBIDDEN/i)).toBeNull();
    // Form state survives the failure; the module stays expanded.
    expect((screen.getByLabelText("New password") as HTMLInputElement).value).toBe(
      "Fresh1Password!",
    );
  });
});
