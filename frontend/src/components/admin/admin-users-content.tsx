"use client";

import { motion } from "motion/react";
import { paginationPageWindow } from "@/utils/project-view";
import {
  ADMIN_AUDIT_BANNER_ROW,
  ADMIN_EXPORT_ROW,
  ADMIN_MISSING_LABEL,
  ADMIN_USERS_COLUMNS,
  ADMIN_USERS_EMPTY_ROW,
  ADMIN_QUERY_FALLBACK,
  ADMIN_ROLE_FILTER_ROWS,
  ADMIN_SELF_ROW_LABEL,
  ADMIN_SHOW_DEACTIVATED_LABEL,
  ADMIN_SEARCH_PLACEHOLDER,
} from "@/data/admin";
import type { AdminMenuActionId, AdminUser, UserRole } from "@/types/admin";
import { formatDate, relativeTime } from "@/utils/relative-time";
import { adminUsersToCsv } from "@/utils/csv";
import { AdminRowMenu } from "@/components/admin/admin-row-menu";
import { AdminRolePill, AdminStatusPill, AdminAvatar } from "@/components/admin/admin-pills";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";

const PANEL =
  "rounded-2xl border border-steel/70 bg-panel/60 shadow-md backdrop-blur-sm";

const COLUMN_CELL = "px-6 py-3 font-mono text-label-sm uppercase tracking-wider text-cinder";

const TOOLBAR_INPUT =
  "h-11 w-full rounded-xl border border-steel bg-basin px-4 font-display text-body-md text-foam outline-none placeholder:text-mist/60 focus:border-teal focus:ring-2 focus:ring-ice/20";

const TOOLBAR_SELECT = "h-11 rounded-xl border border-steel bg-basin px-3 font-display text-body-md text-foam outline-none focus:border-teal";

const SWITCH_TRACK = "flex h-6 w-11 items-center rounded-full border border-steel bg-basin p-0.5";
const SWITCH_THUMB = "h-4.5 w-4.5 rounded-full shadow-sm";

/** Thumb travel inside the 44px track: inner width (44 − 2 border − 4 padding) − 18px thumb. */
const SWITCH_TRAVEL_PX = 20;

interface AdminUsersContentProps {
  users: AdminUser[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  query: string;
  onQuery: (value: string) => void;
  roleFilter: string;
  onRoleFilter: (value: string) => void;
  includeDeleted: boolean;
  onIncludeDeleted: (value: boolean) => void;
  pagination: { page: number; limit: number; total: number; pageCount: number } | undefined;
  page: number;
  onPage: (page: number) => void;
  selfId: string;
  menuUserId: string | null;
  onMenuUserChange: (userId: string | null) => void;
  onMenuAction: (action: AdminMenuActionId, user: AdminUser) => void;
}

export function AdminUsersContent({
  users,
  loading,
  error,
  onRetry,
  query,
  onQuery,
  roleFilter,
  onRoleFilter,
  includeDeleted,
  onIncludeDeleted,
  pagination,
  page,
  onPage,
  selfId,
  menuUserId,
  onMenuUserChange,
  onMenuAction,
}: AdminUsersContentProps) {
  function handleExport() {
    const blob = new Blob([adminUsersToCsv(users)], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = ADMIN_EXPORT_ROW.fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  if (loading) {
    return <p className="pt-8 font-display text-body-md text-mist">{ADMIN_QUERY_FALLBACK.loadingUsers}</p>;
  }
  if (error) {
    return <AdminErrorBlock message={ADMIN_QUERY_FALLBACK.errorUsers} onRetry={onRetry} />;
  }

  const pageCount = pagination?.pageCount ?? 1;
  const total = pagination?.total ?? users.length;
  const first = total === 0 ? 0 : (page - 1) * (pagination?.limit ?? users.length) + 1;
  const last = total === 0 ? 0 : Math.min(total, first + users.length - 1);

  return (
    <div className="flex flex-col gap-5">
      <div className={cn(PANEL, "flex flex-wrap items-center gap-4 px-5 py-4")}>
        <label className="relative flex min-w-[260px] flex-1 items-center">
          <span aria-hidden="true" className="sr-only">
            {ADMIN_SEARCH_PLACEHOLDER}
          </span>
          <MaterialIcon
            name="search"
            className="pointer-events-none absolute left-4 h-11 text-[18px] text-mist"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={ADMIN_SEARCH_PLACEHOLDER}
            className={cn(TOOLBAR_INPUT, "pl-11")}
          />
        </label>
        <select
          value={roleFilter}
          onChange={(event) => onRoleFilter(event.target.value)}
          aria-label="Filter by role"
          className={TOOLBAR_SELECT}
        >
          {ADMIN_ROLE_FILTER_ROWS.map((row) => (
            <option key={row.id} value={row.id}>
              {row.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          role="switch"
          aria-checked={includeDeleted}
          onClick={() => onIncludeDeleted(!includeDeleted)}
          className="group flex items-center gap-3"
          title={ADMIN_SHOW_DEACTIVATED_LABEL}
        >
          <span
            aria-hidden="true"
            className={cn(SWITCH_TRACK, includeDeleted && "border-mint/40 bg-mint/15")}
          >
            <motion.span
              aria-hidden="true"
              initial={false}
              animate={{ x: includeDeleted ? SWITCH_TRAVEL_PX : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className={cn(
                SWITCH_THUMB,
                includeDeleted ? "bg-mint shadow-teal-dot" : "bg-mist",
              )}
            />
          </span>
          <span
            className={cn(
              "font-display text-body-md transition-colors",
              includeDeleted ? "text-foam" : "text-mist group-hover:text-foam",
            )}
          >
            {ADMIN_SHOW_DEACTIVATED_LABEL}
          </span>
        </button>
        <span className="ml-auto font-mono text-label-sm uppercase tracking-wider text-cinder">
          {total} users
        </span>
        <button
          type="button"
          onClick={handleExport}
          aria-label={ADMIN_EXPORT_ROW.triggerLabel}
          title={ADMIN_EXPORT_ROW.triggerLabel}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal text-teal transition-colors hover:bg-teal/10 hover:text-ice"
        >
          <MaterialIcon name="download" className="text-[19px]" />
        </button>
      </div>

      {users.length === 0 ? (
        <div className={cn(PANEL, "flex flex-col items-center gap-3 p-10 text-center")}>
          <MaterialIcon name={ADMIN_USERS_EMPTY_ROW.icon} fill className="text-[40px] text-mist/60" />
          <p className="font-display text-body-md text-mist">{ADMIN_USERS_EMPTY_ROW.copy}</p>
        </div>
      ) : (
        <div className={cn(PANEL, "overflow-hidden")}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-steel/40">
                {ADMIN_USERS_COLUMNS.map((column) => (
                  <th key={column} scope="col" className={cn(COLUMN_CELL, "text-left")}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-steel/25 transition-colors last:border-b-0 hover:bg-surface-mid/70"
                >
                  <td className="w-[30%] px-6 py-4">
                    <div className="flex items-center gap-4">
                      <AdminAvatar name={user.name} className="h-11 w-11 text-body-md" />
                      <div className="min-w-0">
                        <p className="flex min-w-0 items-center gap-2 font-display text-body-md font-semibold text-foam">
                          <span className={cn("truncate", user.status === "DISABLED" && "text-mist/70")}>
                            {user.name}
                          </span>
                          {user.id === selfId ? (
                            <span className="shrink-0 rounded border border-ice/30 bg-ice/10 px-1.5 font-mono text-[10px] font-bold text-ice">
                              {ADMIN_SELF_ROW_LABEL}
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate font-mono text-label-sm text-mist">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <AdminRolePill role={user.role as UserRole} />
                  </td>
                  <td className="px-6 py-4">
                    <AdminStatusPill status={user.status} />
                  </td>
                  <td className="px-6 py-4 font-display text-body-sm text-mist">
                    {user.lastLoginAt ? relativeTime(user.lastLoginAt) : ADMIN_MISSING_LABEL}
                  </td>
                  <td className="px-6 py-4 font-display text-body-sm text-mist">
                    {user.createdAt ? formatDate(user.createdAt) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <AdminRowMenu
                        user={user}
                        selfId={selfId}
                        open={menuUserId === user.id}
                        onOpenChange={(open) => onMenuUserChange(open ? user.id : null)}
                        onAction={onMenuAction}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminUsersPagination
        page={page}
        pageCount={pageCount}
        onPage={onPage}
        caption={buildShowingCaption(page, first, last, total)}
      />

      <AdminAuditBanner />
    </div>
  );
}

function buildShowingCaption(page: number, first: number, last: number, total: number): string {
  if (total === 0 || last === 0) {
    return "0 users";
  }
  return `Page ${page} · showing ${first}-${last} of ${total}`;
}

function AdminAuditBanner() {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-champagne/25 bg-champagne/[0.06] px-6 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-champagne/40 bg-champagne/10">
        <MaterialIcon name={ADMIN_AUDIT_BANNER_ROW.icon} className="text-[19px] text-champagne" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-body-md font-semibold text-champagne-bright">
          {ADMIN_AUDIT_BANNER_ROW.title}
        </p>
        <p className="font-display text-body-sm text-mist">{ADMIN_AUDIT_BANNER_ROW.copy}</p>
      </div>
    </div>
  );
}

function AdminUsersPagination({
  page,
  pageCount,
  onPage,
  caption,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  caption: string;
}) {
  const windowPages = paginationPageWindow(page, pageCount);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-2">
      <span className="font-mono text-label-sm uppercase tracking-wider text-cinder">{caption}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel text-mist transition-colors hover:text-ice disabled:opacity-40"
        >
          <MaterialIcon name="chevron_left" className="text-[18px]" />
        </button>
        {windowPages.map((candidate) => (
          <button
            key={candidate}
            type="button"
            onClick={() => onPage(candidate)}
            aria-current={candidate === page ? "page" : undefined}
            className={cn(
              "flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 font-mono text-code-md transition-colors",
              candidate === page
                ? "border-ice/50 bg-ice/15 font-bold text-ice"
                : "border-steel text-mist hover:text-ice",
            )}
          >
            {candidate}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          aria-label="Next page"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel text-mist transition-colors hover:text-ice disabled:opacity-40"
        >
          <MaterialIcon name="chevron_right" className="text-[18px]" />
        </button>
      </div>
    </div>
  );
}

function AdminErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between rounded-2xl border border-crimson/40 bg-crimson/10 px-6 py-5"
    >
      <p className="font-display text-body-md text-crimson">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="font-display text-body-sm font-semibold text-ice hover:underline"
      >
        {ADMIN_QUERY_FALLBACK.retry}
      </button>
    </div>
  );
}
