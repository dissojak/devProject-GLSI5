"use client";

import Link from "next/link";
import { SESSION_SUMMARY, SESSION_SUMMARY_FIELDS, SESSION_BACK_LINK } from "@/data/session";
import { useAuthSession } from "@/hooks/use-auth-session";
import { buttonClass } from "@/shared/button";

export function SessionSummary() {
  const { user, token } = useAuthSession();

  if (!user || !token) {
    return (
      <div className="w-full max-w-[440px] rounded-[24px] border border-ice/25 bg-panel/60 p-6 shadow-2xl shadow-basin/90 backdrop-blur-xl sm:p-10">
        <h1 className="text-[32px] font-bold leading-tight text-foam">
          {SESSION_SUMMARY.heading}
        </h1>
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
    </div>
  );
}
