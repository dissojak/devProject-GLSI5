"use client";

import Link from "next/link";
import { PROFILE_ERROR_ROWS } from "@/data/profile";
import { PROJECTS_ROUTE } from "@/data/dashboard";
import { Button } from "@/shared/button";
import { MaterialIcon } from "@/shared/material-icon";

/** Screen 6-B: `/profile` fetch failed; offers a cheap refetch and a way out. */
export function ProfileError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-crimson/25 bg-surface-mid p-8">
      <span className="inline-flex items-center rounded-full border border-crimson/40 bg-crimson/10 px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-crimson">
        {PROFILE_ERROR_ROWS.chip}
      </span>
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-crimson/40 bg-crimson/15">
        <MaterialIcon name="warning" className="text-[28px] text-crimson" />
      </span>
      <div className="space-y-1.5">
        <h2 className="font-display text-headline-sm font-semibold text-foam">
          {PROFILE_ERROR_ROWS.title}
        </h2>
        <p className="max-w-xl text-body-sm text-mist">{PROFILE_ERROR_ROWS.copy}</p>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button variant="teal" onClick={onRetry}>
          <MaterialIcon name="refresh" className="text-[16px]" />
          {PROFILE_ERROR_ROWS.retry}
        </Button>
        <Link
          href={PROJECTS_ROUTE.href}
          className="ml-1 text-body-sm font-medium text-mist transition-colors hover:text-foam"
        >
          {PROFILE_ERROR_ROWS.back}
        </Link>
      </div>
    </div>
  );
}
