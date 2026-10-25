import { describe, expect, it } from "vitest";
import { authSessionSlice, sessionCleared, sessionRestored, sessionStarted, parseStoredSession } from "@/store/auth-session";
import type { AuthAccount } from "@/types/auth";

const ADA: AuthAccount = {
  id: "u1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "DEVELOPER",
};

const reducer = authSessionSlice.reducer;

describe("authSession reducer", () => {
  it("starts empty and unhydrated", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({
      token: null,
      user: null,
      hydrated: false,
    });
  });

  it("stores the token and user on sessionStarted", () => {
    expect(
      reducer(undefined, sessionStarted({ accessToken: "token-1", user: ADA })),
    ).toEqual({ token: "token-1", user: ADA, hydrated: false });
  });

  it("clears everything on sessionCleared", () => {
    expect(
      reducer({ token: "token-1", user: ADA, hydrated: true }, sessionCleared()),
    ).toEqual({ token: null, user: null, hydrated: false });
  });

  it("restores a persisted session and marks the store hydrated", () => {
    expect(reducer(undefined, sessionRestored({ token: "token-2", user: ADA }))).toEqual({
      token: "token-2",
      user: ADA,
      hydrated: true,
    });
  });

  it("marks hydration even when persisted storage is empty", () => {
    expect(reducer(undefined, sessionRestored({ token: null, user: null }))).toEqual({
      token: null,
      user: null,
      hydrated: true,
    });
  });
});

describe("parseStoredSession", () => {
  it("returns an empty session for null storage", () => {
    expect(parseStoredSession(null)).toEqual({ token: null, user: null, hydrated: false });
  });

  it("returns an empty session for malformed JSON", () => {
    expect(parseStoredSession("{broken-json" )).toEqual({
      token: null,
      user: null,
      hydrated: false,
    });
  });

  it("returns an empty session for wrong shapes", () => {
    expect(parseStoredSession('{"token":"t"}')).toEqual({
      token: null,
      user: null,
      hydrated: false,
    });
    expect(parseStoredSession('{"token":"t","user":{"id":"u1"}}')).toEqual({
      token: null,
      user: null,
      hydrated: false,
    });
  });

  it("accepts a stored token and user", () => {
    expect(parseStoredSession(JSON.stringify({ token: "token-3", user: ADA }))).toEqual({
      token: "token-3",
      user: ADA,
    });
  });

  it("keeps the hydration flag out of the persisted payload", () => {
    expect(
      parseStoredSession(JSON.stringify({ token: "token-4", user: ADA, hydrated: true })),
    ).toEqual({ token: "token-4", user: ADA });
  });
});
