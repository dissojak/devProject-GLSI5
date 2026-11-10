"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ADMIN_GOVERNANCE_ROWS,
  ADMIN_MISSING_LABEL,
  ADMIN_PENDING_COLUMNS,
  ADMIN_PENDING_EMPTY_ROW,
  ADMIN_PENDING_FOOTER_ROW,
  ADMIN_PENDING_INFO_ROW,
  ADMIN_QUERY_FALLBACK,
  ADMIN_SELF_ROW_LABEL,
} from "@/data/admin";
import type { PendingUser } from "@/types/admin";
import { relativeTime } from "@/utils/relative-time";
import { AdminAvatar, AdminStatusPill } from "@/components/admin/admin-pills";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";

const ROW_CONTAINER =
  "rounded-2xl border border-steel/70 bg-panel/60 shadow-md backdrop-blur-sm";

const COLUMN_CELL = "px-6 py-3 font-mono text-label-sm uppercase tracking-wider text-cinder";

const ACTION_BUTTON_BASE =
  "flex h-9 items-center gap-2 rounded-xl px-4 font-mono text-label-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const ACTION_BUTTON_VARIANTS: Record<"approve" | "reject", string> = {
  approve: "border border-mint/40 bg-mint/10 text-mint hover:bg-mint/20",
  reject: "border border-crimson/40 bg-crimson/10 text-crimson hover:bg-crimson/20",
};

const ACTION_ICONS: Record<"approve" | "reject", "check" | "close"> = {
  approve: "check",
  reject: "close",
};

const ACTION_LABELS: Record<"approve" | "reject", string> = {
  approve: "Approve",
  reject: "Reject",
};

interface AdminPendingContentProps {
  pending: PendingUser[];
  selfId: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  busy: boolean;
  onApprove: (user: PendingUser) => void;
  onReject: (user: PendingUser) => void;
}

export function AdminPendingContent({
  pending,
  selfId,
  loading,
  error,
  onRetry,
  busy,
  onApprove,
  onReject,
}: AdminPendingContentProps) {
  if (loading) {
    return (
      <p className="pt-8 font-display text-body-md text-mist">{ADMIN_QUERY_FALLBACK.loadingPending}</p>
    );
  }
  if (error) {
    return <AdminErrorBlock message={ADMIN_QUERY_FALLBACK.errorPending} onRetry={onRetry} />;
  }
  if (pending.length === 0) {
    return (
      <div className={cn(ROW_CONTAINER, "flex flex-col items-center gap-3 p-10 text-center")}>
        <MaterialIcon name={ADMIN_PENDING_EMPTY_ROW.icon} fill className="text-[40px] text-mint" />
        <p className="font-display text-body-md text-mist">{ADMIN_PENDING_EMPTY_ROW.copy}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="flex items-center gap-2.5 font-display text-body-sm text-mist">
        <MaterialIcon name={ADMIN_PENDING_INFO_ROW.icon} className="text-[16px] text-mist/70" />
        {ADMIN_PENDING_INFO_ROW.copy}
      </p>

      <div className={cn(ROW_CONTAINER, "overflow-hidden")}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-steel/50">
              {ADMIN_PENDING_COLUMNS.map((column) => (
                <th key={column} scope="col" className={cn(COLUMN_CELL, "text-left")}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {pending.map((user) => (
                <motion.tr
                  key={user.id}
                  layout
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                  className="border-b border-steel/25 transition-colors last:border-b-0 hover:bg-surface-mid/70"
                >
                  <td className="w-[34%] px-6 py-4">
                    <div className="flex items-center gap-4">
                      <AdminAvatar name={user.name} className="h-11 w-11 text-body-md" />
                      <div className="min-w-0">
                        <p className="flex min-w-0 items-center gap-2 font-display text-body-md font-semibold text-foam">
                          <span className="truncate">{user.name}</span>
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
                    <AdminStatusPill status={user.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-display text-body-sm text-mist">
                      <MaterialIcon name="schedule" className="text-[16px]" />
                      {user.createdAt ? relativeTime(user.createdAt) : ADMIN_MISSING_LABEL}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <AdminActionButton onClick={() => onApprove(user)} disabled={busy} variant="approve" person={user.name} />
                      <AdminActionButton onClick={() => onReject(user)} disabled={busy} variant="reject" person={user.name} />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-steel/40 bg-basin/40 px-6 py-3">
          <div className="flex items-center gap-2 font-mono text-label-sm uppercase tracking-wider text-mist">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-mint shadow-teal-dot" />
            {ADMIN_PENDING_FOOTER_ROW.statusLabel}
          </div>
          <p className="font-display text-body-sm text-mist">
            {pending.length} {ADMIN_PENDING_FOOTER_ROW.queueSuffix}
          </p>
        </div>
      </div>

      <AdminGovernanceGrid />
    </div>
  );
}

function AdminActionButton({
  onClick,
  disabled,
  variant,
  person,
}: {
  onClick: () => void;
  disabled: boolean;
  variant: "approve" | "reject";
  person: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${ACTION_LABELS[variant]} ${person}`}
      className={cn(ACTION_BUTTON_BASE, ACTION_BUTTON_VARIANTS[variant])}
    >
      <MaterialIcon name={ACTION_ICONS[variant]} className="text-[16px]" fill />
      {ACTION_LABELS[variant]}
    </button>
  );
}

function AdminGovernanceGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {ADMIN_GOVERNANCE_ROWS.map((row, index) => (
        <motion.div
          key={row.id}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.06 }}
          className="flex items-center gap-4 rounded-2xl border border-steel/70 bg-panel/60 p-5 shadow-md"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-steel bg-basin">
            <MaterialIcon name={row.icon} className="text-[20px] text-teal" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-label-sm uppercase tracking-wider text-mist">{row.label}</p>
            <p className="mt-1 font-display text-body-sm text-foam/80">{row.copy}</p>
          </div>
        </motion.div>
      ))}
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
