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
  it("starts empty", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({ token: null, user: null });
  });

  it("stores the token and user on sessionStarted", () => {
    expect(
      reducer(undefined, sessionStarted({ accessToken: "token-1", user: ADA })),
    ).toEqual({ token: "token-1", user: ADA });
  });

  it("clears everything on sessionCleared", () => {
    expect(reducer({ token: "token-1", user: ADA }, sessionCleared())).toEqual({
      token: null,
      user: null,
    });
  });

  it("restores a persisted session on sessionRestored", () => {
    expect(reducer(undefined, sessionRestored({ token: "token-2", user: ADA }))).toEqual({
      token: "token-2",
      user: ADA,
    });
  });
});

describe("parseStoredSession", () => {
  it("returns an empty session for null storage", () => {
    expect(parseStoredSession(null)).toEqual({ token: null, user: null });
  });

  it("returns an empty session for malformed JSON", () => {
    expect(parseStoredSession("{broken-json" )).toEqual({ token: null, user: null });
  });

  it("returns an empty session for wrong shapes", () => {
    expect(parseStoredSession('{"token":"t"}')).toEqual({ token: null, user: null });
    expect(parseStoredSession('{"token":"t","user":{"id":"u1"}}')).toEqual({
      token: null,
      user: null,
    });
  });

  it("accepts a stored token and user", () => {
    expect(parseStoredSession(JSON.stringify({ token: "token-3", user: ADA }))).toEqual({
      token: "token-3",
      user: ADA,
    });
  });
});
