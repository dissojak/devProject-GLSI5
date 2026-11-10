"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { ADMIN_STATUS_MODAL_ROWS } from "@/data/admin";
import type { AdminStatusModalMode, AdminUser } from "@/types/admin";
import { AdminAvatar, AdminRolePill, AdminStatusPill } from "@/components/admin/admin-pills";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";

const MODAL_SPRING = { type: "spring" as const, stiffness: 320, damping: 26 };

interface AdminStatusModalProps {
  mode: AdminStatusModalMode | null;
  user: AdminUser | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function AdminStatusModal({ mode, user, saving, onClose, onConfirm }: AdminStatusModalProps) {
  useEffect(() => {
    if (!mode || !user) return;

    function handleKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mode, user, saving, onClose]);

  return (
    <AnimatePresence>
      {mode && user ? <AdminStatusModalBody mode={mode} user={user} saving={saving} onClose={onClose} onConfirm={onConfirm} /> : null}
    </AnimatePresence>
  );
}

function AdminStatusModalBody({
  mode,
  user,
  saving,
  onClose,
  onConfirm,
}: {
  mode: AdminStatusModalMode;
  user: AdminUser;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const row = ADMIN_STATUS_MODAL_ROWS[mode];

  return (
    <motion.div
      key={`admin-status-backdrop-${mode}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => !saving && onClose()}
      className="fixed inset-0 left-[260px] top-[72px] z-30 flex items-center justify-center overflow-y-auto bg-basin/75 p-4 backdrop-blur-sm"
    >
      <motion.section
        key="admin-status-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-status-title"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={MODAL_SPRING}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[560px] overflow-hidden rounded-[24px] border border-steel bg-navy shadow-modal-glow"
      >
        <div aria-hidden="true" className={cn("h-1 w-full bg-linear-to-r", row.accentClasses)} />
        <div className="p-8">
          <header className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border",
                row.iconTileClasses,
              )}
            >
              <MaterialIcon name={row.icon} className="text-[22px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-label-sm uppercase tracking-widest text-cinder">{row.kicker}</p>
              <h2 id="admin-status-title" className="mt-2 font-display text-headline-md font-bold text-foam">
                {row.titleVerb} {user.name}?
              </h2>
              <p className="mt-1 font-mono text-label-sm uppercase tracking-wider text-mist/70">
                {row.actionCode}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close dialog"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mist transition-colors hover:bg-basin/60 hover:text-foam disabled:opacity-50"
            >
              <MaterialIcon name="close" className="text-[20px]" />
            </button>
          </header>

          <p className="mt-4 font-display text-body-md leading-relaxed text-smoke">{row.copy}</p>

          <div className="mt-5 flex items-center gap-4 rounded-2xl border border-steel/70 bg-panel/50 px-5 py-4">
            <AdminAvatar name={user.name} className="h-11 w-11 text-body-md" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-body-md font-semibold text-foam">{user.name}</p>
              <p className="truncate font-mono text-label-sm text-mist">{user.email}</p>
            </div>
            <AdminStatusPill status={user.status} />
            <AdminRolePill role={user.role} />
          </div>

          <footer className="mt-6 flex items-center justify-end gap-3 border-t border-steel/40 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full px-5 py-2.5 font-mono text-label-md uppercase tracking-widest text-champagne transition-colors hover:bg-champagne/10 disabled:opacity-50"
            >
              {row.cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={saving}
              className={cn(
                "flex h-11 items-center gap-2 rounded-full px-6 font-display text-body-md font-bold transition-all disabled:opacity-50",
                row.confirmVariant === "crimson"
                  ? "bg-crimson text-abyss shadow-lg shadow-crimson/30 hover:bg-rose"
                  : "bg-mint text-abyss shadow-lg shadow-mint/30 hover:bg-mint/80",
              )}
            >
              <MaterialIcon
                name={saving ? "progress_activity" : row.confirmIcon}
                className={cn("text-[18px]", saving && "animate-spin")}
              />
              {row.confirmLabel}
            </button>
          </footer>
        </div>
      </motion.section>
    </motion.div>
  );
}
