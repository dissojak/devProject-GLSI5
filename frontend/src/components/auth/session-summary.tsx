"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { PROJECTS_ROUTE } from "@/data/dashboard";
import { SESSION_SUMMARY, SESSION_SUMMARY_FIELDS, SESSION_BACK_LINK, SESSION_LOGOUT_CTA } from "@/data/session";
import { useAuthSession, useStartSession, useSessionClear } from "@/hooks/use-auth-session";
import { useAccountLogout } from "@/hooks/use-auth-request";
import { AlertBanner } from "@/shared/alert-banner";
import { buttonClass } from "@/shared/button";
import { MaterialIcon } from "@/shared/material-icon";
import { AUTH_ALERTS } from "@/data/auth-alerts";
import { parseGithubHandoff } from "@/utils/auth-responses";

const UNEXPECTED_ALERT = AUTH_ALERTS.unexpected;

const subscribeToNothing = () => () => {};

/**
 * The OAuth callback redirects through `/session#access_token=...`; the hash
 * is read during render (never inside an effect state) and stays a plain
 * string so the snapshot identity is stable.
 */
function useLandingHash(): string {
  return useSyncExternalStore(
    subscribeToNothing,
    () => window.location.hash,
    () => "",
  );
}

export function SessionSummary() {
  const { user, token } = useAuthSession();
  const startSession = useStartSession();
  const clearSession = useSessionClear();
  const { pending, logout } = useAccountLogout();
  const router = useRouter();
  const hash = useLandingHash();
  const handoff = parseGithubHandoff(hash);
  const handoffFailed = Boolean(hash) && !handoff;
  const [logoutFailed, setLogoutFailed] = useState(false);
  useEffect(() => {
    const callbackHandoff = parseGithubHandoff(window.location.hash);

    if (!callbackHandoff) return;

    startSession(callbackHandoff);
    router.replace(PROJECTS_ROUTE.href);
  }, [startSession, router]);

  async function handleLogout() {
    if (!token) return;
    setLogoutFailed(false);
    const result = await logout(token);
    clearSession();
    if (result.kind === "http" && result.httpOk) {
      router.replace(SESSION_BACK_LINK.href);
      return;
    }
    setLogoutFailed(true);
  }

  if (!user || !token) {
    return (
      <div className="w-full max-w-[440px] rounded-[24px] border border-ice/25 bg-panel/60 p-6 shadow-2xl shadow-basin/90 backdrop-blur-xl sm:p-10">
        <h1 className="text-[32px] font-bold leading-tight text-foam">
          {SESSION_SUMMARY.heading}
        </h1>
        {handoffFailed || logoutFailed ? (
          <AlertBanner
            tone={UNEXPECTED_ALERT.tone}
            icon={
              <MaterialIcon
                name={UNEXPECTED_ALERT.icon}
                className="shrink-0 text-[18px]"
              />
            }
            className="mt-4"
          >
            {UNEXPECTED_ALERT.message}
          </AlertBanner>
        ) : null}
        <p className="mt-4 text-sm text-mist">You are not signed in.</p>
        <Link
          href={SESSION_BACK_LINK.href}
          className={buttonClass("primary", "mt-6 h-12 w-full text-sm")}
        >
          {SESSION_BACK_LINK.label}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px] rounded-[24px] border border-ice/25 bg-panel/60 p-6 shadow-2xl shadow-basin/90 backdrop-blur-xl sm:p-10">
      <h1 className="text-[32px] font-bold leading-tight text-foam">
        {SESSION_SUMMARY.heading}
      </h1>
      <div className="mt-6 space-y-3 rounded-[16px] bg-basin p-4">
        {SESSION_SUMMARY_FIELDS.map((field) => (
          <div key={field.id} className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-mist">
              {field.label}
            </span>
            <span className="truncate text-sm font-medium text-foam">{user[field.id]}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-mist">
            {SESSION_SUMMARY.tokenLabel}
          </span>
          <span
            title={token}
            className="min-w-0 truncate font-mono text-xs text-ice"
          >
            {token}
          </span>
        </div>
      </div>
      <Link
        href={SESSION_BACK_LINK.href}
        className={buttonClass("primary", "mt-6 h-12 w-full text-sm")}
      >
        {SESSION_BACK_LINK.label}
      </Link>
      <button
        type="button"
        onClick={() => {
          void handleLogout();
        }}
        disabled={pending}
        className={buttonClass("champagne", "mt-3 h-12 w-full text-sm")}
      >
        {SESSION_LOGOUT_CTA.label}
      </button>
    </div>
  );
}
