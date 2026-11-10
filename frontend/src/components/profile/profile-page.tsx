"use client";

import { useState, type ReactNode } from "react";
import {
  COMPACT_HERO_ROW,
  PROFILE_PAGE_HEADER_ROW,
} from "@/data/profile";
import { AUTH_LOGIN_ROUTE } from "@/data/navigation";
import { initials } from "@/utils/identity";
import { relativeTime } from "@/utils/relative-time";
import { useAuthGate } from "@/hooks/use-session-guard";
import { useGetProfileQuery } from "@/store/profile-api";
import type { ProfileAccount } from "@/types/profile";
import { ProfilePanel } from "@/components/profile/profile-panel";
import { SecurityPanel } from "@/components/profile/security-panel";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";
import { ProfileError } from "@/components/profile/profile-error";
import { Button } from "@/shared/button";
import { MaterialIcon } from "@/shared/material-icon";
import { Pill } from "@/shared/pill";
import { StatusDot } from "@/shared/status-dot";

type ProfileView = "profile" | "password";

/**
 * `/profile` orchestration: gate → skeleton/error (mockup 6) → one visible
 * module per view. The identity form owns the default view; opening the
 * password form swaps to the compact hero (mockup 3).
 */
export function ProfilePage() {
  const status = useAuthGate(AUTH_LOGIN_ROUTE.href);
  const { data, error, refetch } = useGetProfileQuery();
  const [view, setView] = useState<ProfileView>("profile");

  if (status !== "granted") {
    return status === "denied" ? null : <ProfileSkeleton />;
  }
  if (error) {
    return (
      <PageShell>
        <ProfileError
          onRetry={() => {
            void refetch();
          }}
        />
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell>
        <ProfileSkeleton />
      </PageShell>
    );
  }

  const profile = data.data;

  return (
    <PageShell>
      {view === "profile" ? (
        <>
          <ProfilePanel profile={profile} />
          <SecurityPanel
            expanded={false}
            onOpen={() => setView("password")}
            onClose={() => setView("profile")}
          />
        </>
      ) : (
        <>
          <CompactHero profile={profile} onEdit={() => setView("profile")} />
          <SecurityPanel
            expanded
            onOpen={() => undefined}
            onClose={() => setView("profile")}
          />
        </>
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8 md:px-6">
      <header className="space-y-1.5">
        <p className="font-mono text-[10px] font-bold tracking-widest text-ice uppercase">
          {PROFILE_PAGE_HEADER_ROW.kicker}
        </p>
        <h1 className="font-display text-display-sm font-bold text-frost">
          {PROFILE_PAGE_HEADER_ROW.title}
        </h1>
        <p className="text-body-md text-mist">{PROFILE_PAGE_HEADER_ROW.subtitle}</p>
      </header>
      {children}
    </div>
  );
}

function CompactHero({
  profile,
  onEdit,
}: {
  profile: ProfileAccount;
  onEdit: () => void;
}) {
  const loginCopy = profile.lastLoginAt ? `Last login ${relativeTime(profile.lastLoginAt)}` : null;
  return (
    <section aria-label={PROFILE_PAGE_HEADER_ROW.title} className="rounded-2xl border border-ice/20 bg-surface-mid p-6">
      <div className="flex items-center justify-between">
        <Pill tone="quiet" icon={<MaterialIcon name="badge" className="text-[14px] text-teal" />}>
          {PROFILE_PAGE_HEADER_ROW.title}
        </Pill>
        <span className="font-mono text-[10px] tracking-wider text-mist/60">
          ID: {profile.id}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-4">
        {profile.avatarUrl ? (
          <AvatarReadout profile={profile} />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-ice/25 bg-panel font-display text-lg font-bold text-ice">
            {initials(profile.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-headline-sm font-semibold text-foam">
            {profile.name}
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-body-sm text-mist">
            <MaterialIcon name="verified" className="shrink-0 text-[14px] text-mint" />
            {profile.email}
          </p>
          {loginCopy ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-mist/80">
              <MaterialIcon name="schedule" className="text-[14px] text-teal" />
              {loginCopy}
            </p>
          ) : null}
        </div>
        <Button variant="teal" onClick={onEdit}>
          {COMPACT_HERO_ROW.editDetails}
          <MaterialIcon name={COMPACT_HERO_ROW.editIcon} className="text-[16px]" />
        </Button>
      </div>
    </section>
  );
}

function AvatarReadout({ profile }: { profile: ProfileAccount }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-ice/25 bg-panel font-display text-lg font-bold text-ice">
        {initials(profile.name)}
      </span>
    );
  }
  return (
    <span className="relative h-14 w-14">
      <img
        src={profile.avatarUrl ?? ""}
        alt={profile.name}
        className="h-14 w-14 rounded-xl border border-ice/25 object-cover"
        onError={() => setFailed(true)}
      />
      <span className="absolute inset-x-0 -bottom-2 flex justify-center">
        <span className="rounded-full border border-ice/25 bg-basin px-1.5">
          <StatusDot />
        </span>
      </span>
    </span>
  );
}