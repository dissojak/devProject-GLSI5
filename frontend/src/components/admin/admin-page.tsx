"use client";

import { MotionConfig, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useToast } from "@/components/toast/toast-provider";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminPendingContent } from "@/components/admin/admin-pending-content";
import { AdminUsersContent } from "@/components/admin/admin-users-content";
import { AdminEditUserPanel } from "@/components/admin/admin-edit-user-panel";
import { AdminChangeRoleModal } from "@/components/admin/admin-change-role-modal";
import { AdminStatusModal } from "@/components/admin/admin-status-modal";
import {
  useListPendingUsersQuery,
  useApproveUserMutation,
  useRejectUserMutation,
  useListUsersQuery,
  useDeactivateUserMutation,
  useReactivateUserMutation,
  useUpdateUserMutation,
  useChangeUserRoleMutation,
} from "@/store/admin-api";
import {
  ADMIN_PAGE_HEADER_ROW,
  ADMIN_PENDING_STAT_ROW,
  ADMIN_SYNC_ROW,
  ADMIN_TABS,
  ADMIN_TOTAL_STAT_ROW,
} from "@/data/admin";
import type {
  AdminMenuActionId,
  AdminStatusModalMode,
  AdminTabId,
  AdminUser,
  PendingUser,
  UserRole,
} from "@/types/admin";
import type { MaterialIconName } from "@/types/icons";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";

interface ErrorBody {
  data?: { error?: { message?: string } };
}

function backendMessage(error: unknown): string {
  const body = error as ErrorBody;
  return body?.data?.error?.message ?? "Try again.";
}

export function AdminPage() {
  return (
    <AdminGuard>
      <AdminPageInner />
    </AdminGuard>
  );
}

function AdminPageInner() {
  const { user } = useAuthSession();
  const selfId = user?.id ?? "";
  const toast = useToast();

  const [tab, setTab] = useState<AdminTabId>("pending");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [roleFilter, setRoleFilter] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [menuUserId, setMenuUserId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ user: AdminUser; mode: AdminStatusModalMode } | null>(null);

  const pendingQuery = useListPendingUsersQuery();
  const usersQuery = useListUsersQuery({
    q: debouncedQuery || undefined,
    role: roleFilter || undefined,
    includeDeleted,
    page,
    limit: 20,
  });

  const [approveUser, approveMeta] = useApproveUserMutation();
  const [rejectUser, rejectMeta] = useRejectUserMutation();
  const [deactivateUser, deactivateMeta] = useDeactivateUserMutation();
  const [reactivateUser, reactivateMeta] = useReactivateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [changeUserRole] = useChangeUserRoleMutation();

  const pending = useMemo(() => pendingQuery.data?.data ?? [], [pendingQuery.data]);
  const users = useMemo(() => usersQuery.data?.data ?? [], [usersQuery.data]);
  const pagination = usersQuery.data?.pagination;
  const pendingCount = pending.length;
  const totalUsers = pagination?.total ?? users.length;

  const sortedPending = useMemo(
    () =>
      [...pending].sort(
        (first, second) => (second.createdAt ?? "").localeCompare(first.createdAt ?? ""),
      ),
    [pending],
  );

  async function handleApprove(user: PendingUser) {
    try {
      await approveUser({ id: user.id }).unwrap();
      toast.push({ tone: "mint", title: "Approved", message: `${user.name} can now sign in.` });
    } catch (error) {
      toast.push({ tone: "crimson", title: "Approve failed", message: backendMessage(error) });
    }
  }

  async function handleReject(user: PendingUser) {
    try {
      await rejectUser({ id: user.id }).unwrap();
      toast.push({ tone: "champagne", title: "Rejected", message: `${user.name}'s registration was rejected.` });
    } catch (error) {
      toast.push({ tone: "crimson", title: "Reject failed", message: backendMessage(error) });
    }
  }

  async function handleSaveEdit(name: string) {
    if (!editTarget) {
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      await updateUser({ id: editTarget.id, name }).unwrap();
      toast.push({ tone: "mint", title: "Saved", message: `${editTarget.name}'s profile was updated.` });
      setEditTarget(null);
    } catch (error) {
      setEditError(backendMessage(error));
    } finally {
      setEditSaving(false);
    }
  }

  async function handleChangeRole(role: UserRole) {
    if (!roleTarget) {
      return;
    }
    setRoleSaving(true);
    setRoleError(null);
    try {
      await changeUserRole({ id: roleTarget.id, role }).unwrap();
      toast.push({ tone: "mint", title: "Role updated", message: `${roleTarget.name} is now a ${role === "ADMIN" ? "administrator" : "developer"}.` });
      setRoleTarget(null);
    } catch (error) {
      setRoleError(backendMessage(error));
    } finally {
      setRoleSaving(false);
    }
  }

  async function handleStatusConfirm() {
    if (!statusTarget) {
      return;
    }
    const { user: target, mode } = statusTarget;
    try {
      if (mode === "deactivate") {
        await deactivateUser({ id: target.id }).unwrap();
        toast.push({ tone: "champagne", title: "Deactivated", message: `${target.name} can no longer sign in.` });
      } else {
        await reactivateUser({ id: target.id }).unwrap();
        toast.push({ tone: "mint", title: "Reactivated", message: `${target.name} can sign in again.` });
      }
      setStatusTarget(null);
    } catch (error) {
      toast.push({ tone: "crimson", title: "Operation failed", message: backendMessage(error) });
      setStatusTarget(null);
    }
  }

  const menuActionHandlers: Record<AdminMenuActionId, (user: AdminUser) => void> = {
    edit: (user) => setEditTarget(user),
    role: (user) => setRoleTarget(user),
    deactivate: (user) => setStatusTarget({ user, mode: "deactivate" }),
    reactivate: (user) => setStatusTarget({ user, mode: "reactivate" }),
  };

  function handleMenuAction(action: AdminMenuActionId, user: AdminUser) {
    setMenuUserId(null);
    menuActionHandlers[action](user);
  }

  if (!selfId) {
    return null;
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex w-full flex-col gap-6 p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-[520px]">
            <div className="flex items-center gap-2 font-mono text-label-sm uppercase tracking-widest text-teal">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-tide shadow-tide-dot" />
              {ADMIN_PAGE_HEADER_ROW.kicker}
            </div>
            <h1 className="mt-2 font-display text-display-sm font-bold tracking-tight text-frost">
              {ADMIN_PAGE_HEADER_ROW.title}
            </h1>
            <p className="mt-1 font-display text-body-md text-mist">
              {ADMIN_PAGE_HEADER_ROW.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AdminStatCard
              label={ADMIN_PENDING_STAT_ROW.label}
              value={pendingCount}
              unit={ADMIN_PENDING_STAT_ROW.unit}
              hint={ADMIN_PENDING_STAT_ROW.hint}
              icon={ADMIN_PENDING_STAT_ROW.icon}
              valueClasses="text-champagne"
              iconClasses="text-champagne"
            />
            <AdminStatCard
              label={ADMIN_TOTAL_STAT_ROW.label}
              value={totalUsers}
              unit={ADMIN_TOTAL_STAT_ROW.unit}
              hint={`${pendingCount} ${ADMIN_TOTAL_STAT_ROW.hintSuffix}`}
              icon={ADMIN_TOTAL_STAT_ROW.icon}
              valueClasses="text-foam"
              iconClasses="text-teal"
            />
          </div>
        </div>

        <div className="flex items-end gap-1 border-b border-steel/40">
          {ADMIN_TABS.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setTab(row.id)}
              aria-current={tab === row.id ? "page" : undefined}
              className={cn(
                "relative px-4 py-3 font-display text-body-md transition-colors",
                tab === row.id ? "font-semibold text-frost" : "text-mist hover:text-foam",
              )}
            >
              {row.label}
              <span
                className={cn(
                  "ml-2 rounded-full px-2 py-0.5 font-mono text-label-sm",
                  tab === row.id ? "bg-ice/15 text-ice" : "bg-surface-high text-mist",
                )}
              >
                {row.id === "pending" ? pendingCount : totalUsers}
              </span>
              {tab === row.id ? (
                <motion.span
                  layoutId="admin-tab-underline"
                  className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-tide"
                />
              ) : null}
            </button>
          ))}
          {tab === "users" ? (
            <div className="mb-1 ml-auto flex items-center gap-2 font-mono text-label-sm uppercase tracking-wider text-teal">
              <MaterialIcon name="sync" className="text-[16px]" />
              {ADMIN_SYNC_ROW.label}
            </div>
          ) : null}
        </div>

        {tab === "pending" ? (
          <AdminPendingContent
            pending={sortedPending}
            selfId={selfId}
            loading={pendingQuery.isLoading}
            error={pendingQuery.isError}
            onRetry={() => pendingQuery.refetch()}
            busy={isAdminBusy(approveMeta, rejectMeta)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : (
          <AdminUsersContent
            users={users}
            loading={usersQuery.isLoading}
            error={usersQuery.isError}
            onRetry={() => usersQuery.refetch()}
            query={query}
            onQuery={(value) => {
              setQuery(value);
              setPage(1);
            }}
            roleFilter={roleFilter}
            onRoleFilter={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
            includeDeleted={includeDeleted}
            onIncludeDeleted={(value) => {
              setIncludeDeleted(value);
              setPage(1);
            }}
            pagination={pagination}
            page={page}
            onPage={setPage}
            selfId={selfId}
            menuUserId={menuUserId}
            onMenuUserChange={setMenuUserId}
            onMenuAction={handleMenuAction}
          />
        )}
      </div>

      <AdminEditUserPanel
        user={editTarget}
        saving={editSaving}
        error={editError}
        onClose={() => {
          setEditTarget(null);
          setEditError(null);
        }}
        onSave={handleSaveEdit}
      />
      <AdminChangeRoleModal
        user={roleTarget}
        saving={roleSaving}
        error={roleError}
        onDismissError={() => setRoleError(null)}
        onClose={() => {
          setRoleTarget(null);
          setRoleError(null);
        }}
        onSubmit={handleChangeRole}
      />
      <AdminStatusModal
        mode={statusTarget?.mode ?? null}
        user={statusTarget?.user ?? null}
        saving={isAdminBusy(deactivateMeta, reactivateMeta)}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusConfirm}
      />
    </MotionConfig>
  );
}

function isAdminBusy(...metas: Array<{ isLoading: boolean }>): boolean {
  return metas.some((meta) => meta.isLoading);
}

function AdminStatCard({
  label,
  value,
  unit,
  hint,
  icon,
  valueClasses,
  iconClasses,
}: {
  label: string;
  value: number;
  unit: string;
  hint: string;
  icon: MaterialIconName;
  valueClasses: string;
  iconClasses: string;
}) {
  return (
    <div className="w-[240px] rounded-2xl border border-steel/70 bg-panel/70 p-5 shadow-md backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-label-sm uppercase tracking-wider text-cinder">{label}</span>
        <MaterialIcon name={icon} className={cn("text-[20px]", iconClasses)} />
      </div>
      <p className="mt-2 flex items-baseline gap-2">
        <span className={cn("font-display text-[34px] font-bold leading-none", valueClasses)}>{value}</span>
        <span className="font-mono text-label-sm uppercase tracking-wider text-mist">{unit}</span>
      </p>
      <p className="mt-2 font-display text-body-sm text-mist">{hint}</p>
    </div>
  );
}
