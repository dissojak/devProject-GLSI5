"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import {
  ADMIN_EDIT_PANEL_ROW,
  ADMIN_MISSING_LABEL,
} from "@/data/admin";
import type { AdminUser } from "@/types/admin";
import { formatDate, shortDateTime } from "@/utils/relative-time";
import { AdminAvatar, AdminRolePill, AdminStatusPill } from "@/components/admin/admin-pills";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";

const PANEL_SPRING = { type: "spring" as const, stiffness: 300, damping: 32 };

const IDENTITY_DOT_TONE: Record<AdminUser["status"], string> = {
  PENDING: "bg-champagne ring-champagne/40",
  ACTIVE: "bg-mint ring-mint/40",
  REJECTED: "bg-crimson ring-crimson/40",
  DISABLED: "bg-orange ring-orange/40",
};

const ADMIN_INFO_FIELD = {
  role: "role",
  status: "status",
  enrolled: "enrolled",
  lastSession: "lastSession",
} as const;

type AdminInfoFieldId = (typeof ADMIN_INFO_FIELD)[keyof typeof ADMIN_INFO_FIELD];

const INFO_FIELD_ROWS: Array<{ id: AdminInfoFieldId; label: string }> = [
  { id: ADMIN_INFO_FIELD.role, label: "Assigned role" },
  { id: ADMIN_INFO_FIELD.status, label: "System status" },
  { id: ADMIN_INFO_FIELD.enrolled, label: "Enrollment date" },
  { id: ADMIN_INFO_FIELD.lastSession, label: "Last session active" },
];

function infoFieldValue(user: AdminUser, field: AdminInfoFieldId): ReactNode {
  if (field === ADMIN_INFO_FIELD.role) return <AdminRolePill role={user.role} />;
  if (field === ADMIN_INFO_FIELD.status) return <AdminStatusPill status={user.status} />;
  if (field === ADMIN_INFO_FIELD.enrolled) return formatDate(user.createdAt);
  return user.lastLoginAt ? shortDateTime(user.lastLoginAt) : ADMIN_MISSING_LABEL;
}

interface AdminEditUserPanelProps {
  user: AdminUser | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function AdminEditUserPanel({ user, saving, error, onClose, onSave }: AdminEditUserPanelProps) {
  const [editedId, setEditedId] = useState<string | null>(null);
  const [name, setName] = useState("");

  if (user && user.id !== editedId) {
    setEditedId(user.id);
    setName(user.name);
  }
  if (!user && editedId !== null) {
    setEditedId(null);
  }

  useEffect(() => {
    if (!user) return;

    function handleKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [user, saving, onClose]);

  const trimmed = name.trim();
  const invalid = trimmed.length > 0 && trimmed.length < 2;
  const unchanged = Boolean(user) && trimmed === (user?.name ?? "").trim();
  const canSave = Boolean(user) && !saving && !invalid && trimmed.length >= 2 && !unchanged;

  return (
    <AnimatePresence>
      {user ? (
        <motion.div
          key="edit-user-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => !saving && onClose()}
          className="fixed inset-0 left-[260px] top-[72px] z-30 overflow-y-auto bg-basin/75 p-6 backdrop-blur-sm"
        >
          <motion.section
            key="edit-user-panel"
            role="dialog"
            aria-modal="true"
            aria-label={ADMIN_EDIT_PANEL_ROW.title}
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={PANEL_SPRING}
            onClick={(event) => event.stopPropagation()}
            className="ml-auto flex min-h-full w-full max-w-[560px] flex-col rounded-l-[20px] border border-steel bg-navy shadow-modal-glow"
          >
            <header className="flex items-start justify-between border-b border-steel/40 px-8 pb-5 pt-7">
              <div>
                <h2 className="font-display text-headline-md font-bold text-foam">
                  {ADMIN_EDIT_PANEL_ROW.title}
                </h2>
                <p className="mt-1 font-mono text-label-sm uppercase tracking-wider text-mist">
                  UUID: {truncateUuid(user.id)}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                aria-label={ADMIN_EDIT_PANEL_ROW.closeLabel}
                className="flex h-9 w-9 items-center justify-center rounded-full text-mist transition-colors hover:bg-basin/60 hover:text-foam disabled:opacity-50"
              >
                <MaterialIcon name="close" className="text-[20px]" />
              </button>
            </header>

            <form
              className="flex flex-1 flex-col gap-6 px-8 py-6"
              onSubmit={(event) => {
                event.preventDefault();
                if (canSave) {
                  onSave(trimmed);
                }
              }}
            >
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-steel/70 bg-panel/50 p-6 text-center">
                <div className="relative">
                  <AdminAvatar name={user.name} className="h-20 w-20 text-[26px]" />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ring-2 ring-navy",
                      IDENTITY_DOT_TONE[user.status],
                    )}
                  />
                </div>
                <p className="mt-1 font-display text-headline-sm font-bold text-foam">{user.name}</p>
                <p className="flex items-center gap-1.5 font-mono text-code-md text-mist">
                  <MaterialIcon name="lock" className="text-[14px]" />
                  {user.email}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <AdminRolePill role={user.role} />
                  <AdminStatusPill status={user.status} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="admin-edit-name" className="font-display text-body-md text-foam">
                    {ADMIN_EDIT_PANEL_ROW.nameFieldLabel}
                  </label>
                  <span aria-hidden="true" className="font-mono text-label-sm text-mist/70">
                    {trimmed.length} / {ADMIN_EDIT_PANEL_ROW.nameMaxLength}
                  </span>
                </div>
                <div
                  className={cn(
                    "mt-2 flex h-12 w-full items-center gap-3 rounded-xl border bg-basin px-4 transition-colors",
                    invalid ? "border-crimson/70" : "border-steel focus-within:border-teal",
                  )}
                >
                  <MaterialIcon name="badge" className="text-[18px] text-mist" />
                  <input
                    id="admin-edit-name"
                    value={name}
                    maxLength={ADMIN_EDIT_PANEL_ROW.nameMaxLength}
                    aria-invalid={invalid || undefined}
                    aria-describedby={invalid ? "admin-edit-name-error" : undefined}
                    onChange={(event) => setName(event.target.value)}
                    className="h-full w-full border-none bg-transparent p-0 font-display text-body-md text-foam outline-none"
                  />
                  <MaterialIcon name="tune" className="text-[18px] text-mist" />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <AnimatePresence>
                    {invalid ? (
                      <motion.p
                        id="admin-edit-name-error"
                        role="alert"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-1.5 font-display text-body-sm text-crimson"
                      >
                        <MaterialIcon name="priority_high" className="text-[14px]" />
                        {ADMIN_EDIT_PANEL_ROW.nameMinLengthError}
                      </motion.p>
                    ) : (
                      <p className="font-display text-body-sm text-mist/70">
                        {ADMIN_EDIT_PANEL_ROW.nameHint}
                      </p>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence>
                  {error ? (
                    <motion.p
                      role="alert"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 flex items-center gap-2 rounded-xl border border-crimson/40 bg-crimson/10 px-4 py-2.5 font-display text-body-sm text-crimson"
                    >
                      <MaterialIcon name="error" className="text-[16px]" />
                      {error}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="rounded-2xl border border-steel/70 bg-panel/50 p-6">
                <p className="font-mono text-label-sm uppercase tracking-wider text-cinder">
                  {ADMIN_EDIT_PANEL_ROW.infoHeading}
                </p>
                <dl className="mt-4 flex flex-col divide-y divide-steel/25">
                  {INFO_FIELD_ROWS.map((row) => (
                    <div key={row.id} className="flex items-center justify-between gap-4 py-3">
                      <dt className="font-display text-body-md text-mist">{row.label}</dt>
                      <dd className="font-display text-body-md text-foam">{infoFieldValue(user, row.id)}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-auto flex items-center justify-end gap-4 border-t border-steel/40 pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-full px-4 py-2 font-display text-body-md text-champagne transition-colors hover:bg-champagne/10 disabled:opacity-50"
                >
                  {ADMIN_EDIT_PANEL_ROW.cancelLabel}
                </button>
                <button
                  type="submit"
                  disabled={!canSave}
                  className="flex h-11 items-center gap-2 rounded-full bg-ice px-6 font-display text-body-md font-bold text-navy shadow-lg shadow-ice/20 transition-colors hover:bg-ice-bright disabled:opacity-50"
                >
                  <MaterialIcon
                    name={saving ? "progress_activity" : ADMIN_EDIT_PANEL_ROW.submitIcon}
                    className={cn("text-[18px]", saving && "animate-spin")}
                  />
                  {ADMIN_EDIT_PANEL_ROW.submitLabel}
                </button>
              </div>
            </form>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const UUID_DISPLAY_LENGTH = 12;

function truncateUuid(id: string): string {
  return id.length > UUID_DISPLAY_LENGTH ? `${id.slice(0, UUID_DISPLAY_LENGTH)}…` : id;
}
