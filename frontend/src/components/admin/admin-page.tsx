"use client";

import { useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { useToast } from "@/components/toast/toast-provider";
import { AdminGuard } from "@/components/admin/admin-guard";
import {
  useListPendingUsersQuery,
  useApproveUserMutation,
  useRejectUserMutation,
  useListUsersQuery,
  useDeactivateUserMutation,
  useReactivateUserMutation,
} from "@/store/admin-api";
import type { AdminUser, PendingUser, AccountStatus } from "@/types/admin";
import { MaterialIcon } from "@/shared/material-icon";
import { Button } from "@/shared/button";
import { cn } from "@/utils/class-names";

const STATUS_CLASSES: Record<AccountStatus, string> = {
  PENDING: "bg-champagne/15 text-champagne",
  ACTIVE: "bg-mint/15 text-mint",
  REJECTED: "bg-crimson/15 text-crimson",
  DISABLED: "bg-mist/15 text-mist",
};

export function AdminPage() {
  return (
    <AdminGuard>
      <AdminPageInner />
    </AdminGuard>
  );
}

function AdminPageInner() {
  const toast = useToast();
  const [tab, setTab] = useState<"pending" | "users">("pending");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const pendingQuery = useListPendingUsersQuery();
  const usersQuery = useListUsersQuery({
    q: query || undefined,
    role: roleFilter || undefined,
    page,
    limit: 20,
  });

  const [approve, approveMeta] = useApproveUserMutation();
  const [reject, rejectMeta] = useRejectUserMutation();
  const [deactivate, deactivateMeta] = useDeactivateUserMutation();
  const [reactivate, reactivateMeta] = useReactivateUserMutation();

  const pending = pendingQuery.data?.data ?? [];
  const users = usersQuery.data?.data ?? [];
  const pagination = usersQuery.data?.pagination;

  const totalUsers = pagination?.total ?? users.length;
  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const rejectedCount = users.filter((u) => u.status === "REJECTED").length;
  const pendingCount = pending.length;

  async function handleApprove(user: PendingUser) {
    try {
      await approve({ id: user.id }).unwrap();
      toast.push({ tone: "mint", title: "Approved", message: `${user.name} can now sign in.` });
    } catch (err) {
      const e = err as { data?: { error?: { message?: string } } };
      toast.push({ tone: "crimson", title: "Approve failed", message: e?.data?.error?.message ?? "Try again." });
    }
  }
  async function handleReject(user: PendingUser) {
    try {
      await reject({ id: user.id }).unwrap();
      toast.push({ tone: "champagne", title: "Rejected", message: `${user.name}'s registration was rejected.` });
    } catch (err) {
      const e = err as { data?: { error?: { message?: string } } };
      toast.push({ tone: "crimson", title: "Reject failed", message: e?.data?.error?.message ?? "Try again." });
    }
  }
  async function handleDeactivate(user: AdminUser) {
    try {
      await deactivate({ id: user.id }).unwrap();
      toast.push({ tone: "champagne", title: "Deactivated", message: `${user.name} can no longer sign in.` });
    } catch (err) {
      const e = err as { data?: { error?: { message?: string } } };
      toast.push({ tone: "crimson", title: "Deactivate failed", message: e?.data?.error?.message ?? "Try again." });
    }
  }
  async function handleReactivate(user: AdminUser) {
    try {
      await reactivate({ id: user.id }).unwrap();
      toast.push({ tone: "mint", title: "Reactivated", message: `${user.name} can sign in again.` });
    } catch (err) {
      const e = err as { data?: { error?: { message?: string } } };
      toast.push({ tone: "crimson", title: "Reactivate failed", message: e?.data?.error?.message ?? "Try again." });
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex w-full flex-col gap-6 p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-mist/60">
              <span>DeploymentPlanner AI</span>
              <span className="text-steel">/</span>
              <span className="text-mist">Administration</span>
            </div>
            <h1 className="mt-2 font-display text-headline-lg font-bold tracking-tight text-foam">
              Administration
            </h1>
            <p className="mt-1 font-display text-body-md text-mist">
              Approve new accounts and manage platform users.
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-ice px-5 py-2.5 font-display text-body-md font-semibold text-navy shadow-ice-submit hover:shadow-ice-halo"
          >
            <MaterialIcon name="person_add" className="text-[18px]" />
            Invite user
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Pending approvals" value={pendingCount} hint="Action required" tone="champagne" />
          <StatCard label="Total users" value={totalUsers} hint={`${activeCount} active · ${rejectedCount} rejected · ${pendingCount} pending`} tone="ice" />
          <StatCard label="Workspace core" value={totalUsers} hint="All registered accounts" tone="mist" />
        </div>

        <div className="flex items-center gap-1 border-b border-steel/40">
          {(["pending", "users"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "relative px-4 py-2.5 font-display text-body-md transition-colors",
                tab === t ? "text-foam" : "text-mist hover:text-foam",
              )}
            >
              {t === "pending" ? "Pending approvals" : "All users"}
              <span className="ml-2 rounded-full bg-surface-high px-2 py-0.5 font-mono text-label-sm text-mist">
                {t === "pending" ? pendingCount : totalUsers}
              </span>
              {tab === t ? (
                <motion.span
                  layoutId="admin-tab-underline"
                  className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-ice"
                />
              ) : null}
            </button>
          ))}
        </div>

        {tab === "pending" ? (
          <PendingSection
            pending={pending}
            loading={pendingQuery.isLoading}
            error={pendingQuery.isError}
            onRetry={() => pendingQuery.refetch()}
            onApprove={handleApprove}
            onReject={handleReject}
            busy={approveMeta.isLoading || rejectMeta.isLoading}
          />
        ) : (
          <UsersSection
            users={users}
            loading={usersQuery.isLoading}
            error={usersQuery.isError}
            onRetry={() => usersQuery.refetch()}
            query={query}
            onQuery={setQuery}
            roleFilter={roleFilter}
            onRoleFilter={setRoleFilter}
            pagination={pagination}
            page={page}
            onPage={setPage}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
            busy={deactivateMeta.isLoading || reactivateMeta.isLoading}
          />
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentActions />
          <StatusLegend />
        </div>
      </div>
    </MotionConfig>
  );
}

function StatCard({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: "champagne" | "ice" | "mist" }) {
  const classes =
    tone === "champagne" ? "text-champagne" : tone === "ice" ? "text-ice" : "text-mist";
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-steel bg-panel p-5 shadow-md">
      <span className="font-mono text-label-sm uppercase text-cinder">{label}</span>
      <span className={cn("font-display text-headline-lg font-bold", classes)}>{value}</span>
      <span className="font-display text-body-sm text-mist">{hint}</span>
    </div>
  );
}

function PendingSection({
  pending,
  loading,
  error,
  onRetry,
  onApprove,
  onReject,
  busy,
}: {
  pending: PendingUser[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onApprove: (u: PendingUser) => void;
  onReject: (u: PendingUser) => void;
  busy: boolean;
}) {
  if (loading) return <p className="font-display text-body-md text-mist">Loading pending approvals…</p>;
  if (error) return <ErrorBlock message="Could not load pending approvals." onRetry={onRetry} />;
  if (pending.length === 0) {
    return (
      <div className="rounded-2xl border border-steel bg-panel p-8 text-center">
        <MaterialIcon name="done_all" className="text-[32px] text-mint" />
        <p className="mt-2 font-display text-body-md text-mist">No pending approvals. You are all caught up.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {pending.map((user) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 rounded-2xl border border-steel bg-panel p-5 shadow-md"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-high font-display text-body-md font-bold text-foam">
                {initials(user.name)}
              </div>
              <div>
                <p className="font-display text-body-md font-semibold text-foam">{user.name}</p>
                <p className="font-mono text-label-sm text-mist">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-surface-high px-2.5 py-0.5 font-mono text-label-sm text-mist">
                {user.role}
              </span>
              <span className={cn("rounded-full px-2.5 py-0.5 font-mono text-label-sm uppercase", STATUS_CLASSES[user.status])}>
                {user.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => onApprove(user)} disabled={busy} className="h-8 gap-2 px-4">
              <MaterialIcon name="check" className="text-[14px]" />
              Approve
            </Button>
            <Button variant="champagne" onClick={() => onReject(user)} disabled={busy} className="h-8 px-4">
              Reject
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function UsersSection({
  users,
  loading,
  error,
  onRetry,
  query,
  onQuery,
  roleFilter,
  onRoleFilter,
  pagination,
  page,
  onPage,
  onDeactivate,
  onReactivate,
  busy,
}: {
  users: AdminUser[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  query: string;
  onQuery: (v: string) => void;
  roleFilter: string;
  onRoleFilter: (v: string) => void;
  pagination: { page: number; limit: number; total: number; pageCount: number } | undefined;
  page: number;
  onPage: (p: number) => void;
  onDeactivate: (u: AdminUser) => void;
  onReactivate: (u: AdminUser) => void;
  busy: boolean;
}) {
  if (loading) return <p className="font-display text-body-md text-mist">Loading users…</p>;
  if (error) return <ErrorBlock message="Could not load users." onRetry={onRetry} />;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search users…"
          className="h-10 w-64 rounded-xl border border-steel bg-basin px-4 font-display text-body-md text-foam outline-none focus:border-teal"
        />
        <select
          value={roleFilter}
          onChange={(e) => onRoleFilter(e.target.value)}
          className="h-10 rounded-xl border border-steel bg-basin px-3 font-display text-body-md text-foam"
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="DEVELOPER">Developer</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </div>
      <div className="overflow-hidden rounded-2xl border border-steel bg-panel shadow-md">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-steel/40 bg-basin/60 text-left">
              <th className="px-4 py-3 font-mono text-label-sm uppercase text-cinder">User</th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase text-cinder">Role</th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase text-cinder">Status</th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase text-cinder">Last login</th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase text-cinder">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-steel/20 hover:bg-basin/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-high font-display text-body-sm font-bold text-foam">
                      {initials(user.name)}
                    </div>
                    <div>
                      <p className="font-display text-body-md font-semibold text-foam">{user.name}</p>
                      <p className="font-mono text-label-sm text-mist">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-code-md text-mist">{user.role}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2.5 py-0.5 font-mono text-label-sm uppercase", STATUS_CLASSES[user.status])}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-label-sm text-mist">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {user.isActive ? (
                      <button
                        type="button"
                        onClick={() => onDeactivate(user)}
                        disabled={busy}
                        className="font-display text-body-sm text-crimson hover:underline disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onReactivate(user)}
                        disabled={busy}
                        className="font-display text-body-sm text-mint hover:underline disabled:opacity-50"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.pageCount > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button variant="champagne" disabled={page <= 1} onClick={() => onPage(Math.max(1, page - 1))} className="h-9 px-4">Previous</Button>
          <span className="font-mono text-label-sm text-mist">Page {pagination.page} of {pagination.pageCount}</span>
          <Button variant="champagne" disabled={page >= pagination.pageCount} onClick={() => onPage(Math.min(pagination.pageCount, page + 1))} className="h-9 px-4">Next</Button>
        </div>
      ) : null}
    </div>
  );
}

function RecentActions() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-steel bg-panel p-6 shadow-md">
      <p className="font-display text-headline-sm font-bold text-foam">Recent user actions</p>
      <p className="font-display text-body-sm text-mist">Live audit feed — endpoint not yet exposed by the backend.</p>
    </div>
  );
}

function StatusLegend() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-steel bg-panel p-6 shadow-md">
      <p className="font-display text-headline-sm font-bold text-foam">Status &amp; role legend</p>
      <div className="flex flex-col gap-2">
        <p className="font-mono text-label-sm uppercase text-cinder">Account statuses</p>
        <div className="flex flex-wrap gap-2">
          {(["PENDING", "ACTIVE", "REJECTED", "DISABLED"] as AccountStatus[]).map((s) => (
            <span key={s} className={cn("rounded-full px-2.5 py-0.5 font-mono text-label-sm uppercase", STATUS_CLASSES[s])}>
              {s}
            </span>
          ))}
        </div>
        <p className="mt-2 font-mono text-label-sm uppercase text-cinder">Roles</p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-surface-high px-2.5 py-0.5 font-mono text-label-sm text-mist">Developer</span>
          <span className="rounded-full bg-surface-high px-2.5 py-0.5 font-mono text-label-sm text-mist">Administrator</span>
        </div>
        <p className="mt-2 font-mono text-label-sm uppercase text-cinder">LDAP &amp; SSO sync</p>
        <p className="font-display text-body-sm text-mist">Connected · ms-azure-ad-01</p>
      </div>
    </div>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-crimson/40 bg-crimson/10 p-6">
      <p className="font-display text-body-md text-crimson">{message}</p>
      <button type="button" onClick={onRetry} className="mt-2 font-display text-body-sm text-ice hover:underline">
        Retry
      </button>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
