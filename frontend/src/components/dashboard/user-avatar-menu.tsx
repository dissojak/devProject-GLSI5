"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { cn } from "@/utils/class-names";
import { initials, titleCase } from "@/utils/identity";
import {
  AVATAR_MENU_ACCOUNT_SECTION,
  AVATAR_MENU_ADMINISTRATION_SECTION,
  AVATAR_MENU_LOGOUT_LABEL,
  USER_BADGE_ROWS,
} from "@/data/dashboard";
import { AUTH_LOGIN_ROUTE } from "@/data/navigation";
import { useAuthSession, useSessionClear } from "@/hooks/use-auth-session";
import { useMounted } from "@/hooks/use-mounted";
import { useAccountLogout } from "@/hooks/use-auth-request";
import { useListPendingUsersQuery } from "@/store/admin-api";
import { useListProjectsQuery } from "@/store/projects-api";
import type { UserMenuItemRow, UserMenuRoleKind, UserMenuSectionRow } from "@/types/dashboard";
import { MaterialIcon } from "@/shared/material-icon";

const BADGE_PILL_BASE =
  "inline-flex min-w-[20px] h-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold bg-champagne text-navy";

const ROLE_PILL_BASE =
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] tracking-wide";

const ITEM_ROW_BASE =
  "group flex h-10 w-full items-center gap-3 rounded-xl border border-transparent px-3 text-sm font-medium text-foam transition-colors hover:bg-ice/[0.08] hover:text-ice focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ice/40";

/** Mockup 7: the row whose href matches the current path gets the ice wash. */
const ITEM_ROW_ACTIVE =
  "bg-ice/15 text-ice border-ice/30 shadow-sm shadow-ice/10";

const SECTION_LABEL_BASE =
  "px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-mist/70";

const MENU_SECTIONS_BY_ROLE: Record<UserMenuRoleKind, UserMenuSectionRow[]> = {
  admin: [AVATAR_MENU_ADMINISTRATION_SECTION, AVATAR_MENU_ACCOUNT_SECTION],
  developer: [AVATAR_MENU_ACCOUNT_SECTION],
  other: [AVATAR_MENU_ACCOUNT_SECTION],
};

function menuRoleKind(role: string): UserMenuRoleKind {
  const normalized = role.trim().toUpperCase();
  if (normalized === "ADMIN") return "admin";
  if (normalized === "DEVELOPER") return "developer";
  return "other";
}

function MenuIcon({ name, active }: { name: UserMenuItemRow["icon"]; active?: boolean }) {
  return (
    <MaterialIcon
      name={name}
      className={cn(
        "shrink-0 text-[18px] text-teal transition-colors group-hover:text-ice",
        active && "text-ice",
      )}
    />
  );
}

function UserMenuItem({ row, onSelect }: { row: UserMenuItemRow; onSelect: () => void }) {
  const pathname = usePathname();
  const active = row.href !== undefined && pathname === row.href;
  const activeClasses = active ? ITEM_ROW_ACTIVE : null;
  const icon = <MenuIcon name={row.icon} active={active} />;
  const label = (
    <span className={cn("truncate", active && "font-semibold tracking-tight")}>{row.label}</span>
  );
  const activeDot = active ? (
    <span aria-hidden="true" className="ml-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ice shadow-sm" />
  ) : null;

  if (row.href) {
    return (
      <Link href={row.href} role="menuitem" aria-current={active ? "page" : undefined} className={cn(ITEM_ROW_BASE, activeClasses)} onClick={onSelect}>
        {icon}
        {label}
        {activeDot}
        {row.badge ? <UserMenuLiveBadge row={row} /> : null}
      </Link>
    );
  }
  return (
    <button type="button" role="menuitem" className={cn(ITEM_ROW_BASE, activeClasses)} onClick={onSelect}>
      {icon}
      {label}
      {activeDot}
      {row.externalMark ? (
        <MaterialIcon
          name="open_in_new"
          className="ml-auto shrink-0 text-[14px] text-mist transition-colors group-hover:text-ice"
        />
      ) : null}
      {row.badge ? <UserMenuLiveBadge row={row} /> : null}
    </button>
  );
}

/**
 * Live badge counts for menu rows. Mounted only where a menu row declares a
 * badge (opened, user-menu panel), so the RTKQ hooks never run during prerender
 * (Cache Components guard); until data arrives the static badge value from
 * `data/` stands in.
 */
function UserMenuLiveBadge({ row }: { row: UserMenuItemRow }) {
  const kind = row.badgeKind ?? "pending";
  if (kind === "pending") {
    return <PendingApprovalsBadge fallback={row.badge} />;
  }
  return <MyProjectsBadge fallback={row.badge} />;
}

function PendingApprovalsBadge({ fallback }: { fallback?: string }) {
  const pendingQuery = useListPendingUsersQuery();
  const pending = pendingQuery.data?.data;
  return (
    <span className={cn(BADGE_PILL_BASE, "ml-auto")}>
      {pending ? String(pending.length) : fallback}
    </span>
  );
}

function MyProjectsBadge({ fallback }: { fallback?: string }) {
  const projectsQuery = useListProjectsQuery({ page: 1, limit: 1 });
  const total = projectsQuery.data?.pagination.total;
  return (
    <span
      aria-hidden="true"
      className="ml-auto font-mono text-[10px] text-teal/60 transition-colors group-hover:text-teal"
    >
      {typeof total === "number" ? `#${total}` : fallback}
    </span>
  );
}

function UserMenuSection({ section, onSelect }: { section: UserMenuSectionRow; onSelect: () => void }) {
  return (
    <div className="px-2 pt-2 pb-1">
      <div className={SECTION_LABEL_BASE}>{section.label}</div>
      <div className="space-y-0.5">
        {section.items.map((row) => (
          <UserMenuItem key={row.id} row={row} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

export function UserAvatarMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const session = useAuthSession();
  const mounted = useMounted();
  const user = mounted ? session.user : null;
  const token = session.token;
  const clearSession = useSessionClear();
  const { pending, logout } = useAccountLogout();
  const router = useRouter();
  const roleKindId = menuRoleKind(user?.role ?? "");

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: globalThis.MouseEvent) => {
      if (rootRef.current instanceof Element && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function stopPanel(event: ReactMouseEvent) {
    event.stopPropagation();
  }

  async function handleLogout() {
    if (!token || pending) return;
    await logout(token);
    clearSession();
    setOpen(false);
    router.replace(AUTH_LOGIN_ROUTE.href);
  }

  const role = user?.role ?? "";
  const badgeRow = USER_BADGE_ROWS[roleKindId];
  const badgeLabel = badgeRow.label ?? titleCase(role);
  const sections = MENU_SECTIONS_BY_ROLE[roleKindId];

  return (
    <div ref={rootRef} className="relative">
      <motion.button
        ref={triggerRef}
        id="user-avatar-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-avatar-menu"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-ice font-sans text-sm font-bold text-navy ring-2 ring-ice shadow-ice-avatar"
      >
        {initials(user?.name ?? "")}
      </motion.button>
      <AnimatePresence>
        {open ? (
          <motion.div
            id="user-avatar-menu"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={stopPanel}
            className="absolute right-0 top-full z-30 mt-[12px] origin-top-right"
          >
            <div
              aria-hidden="true"
              className="absolute -top-1.5 right-7 -z-10 h-3 w-3 rotate-45 rounded-[2px] border-l border-t border-ice/25 bg-panel/90"
            />
            <div
              role="menu"
              aria-labelledby="user-avatar-trigger"
              className="w-[280px] rounded-2xl border border-ice/25 bg-panel/90 font-sans text-left backdrop-blur-xl shadow-avatar-menu"
            >
              <div className="flex items-start gap-3 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ice font-sans text-base font-bold text-navy ring-1 ring-ice/40 shadow-sm">
                  {initials(user?.name ?? "")}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="mb-0.5 truncate font-sans text-sm font-bold text-foam">
                    {user?.name ?? ""}
                  </h2>
                  <p className="mb-2 truncate font-sans text-xs text-mist">{user?.email ?? ""}</p>
                  <span className={cn(ROLE_PILL_BASE, badgeRow.classes)}>{badgeLabel}</span>
                </div>
              </div>
              <div className="mx-3 h-px bg-ice/[0.18]" />
              <div className="py-1">
                {sections.map((section) => (
                  <UserMenuSection
                    key={section.id}
                    section={section}
                    onSelect={() => setOpen(false)}
                  />
                ))}
              </div>
              <div className="mx-3 h-px bg-ice/[0.18]" />
              <div className="p-2">
                <button
                  type="button"
                  role="menuitem"
                  disabled={pending || !token}
                  onClick={() => {
                    void handleLogout();
                  }}
                  className={cn(ITEM_ROW_BASE, "text-crimson hover:bg-crimson/15")}
                >
                  <MaterialIcon name="logout" className="shrink-0 text-[18px] text-crimson" />
                  <span>{AVATAR_MENU_LOGOUT_LABEL}</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
