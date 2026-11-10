"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { ADMIN_ROLE_MODAL_ROW, ADMIN_ROLE_OPTIONS } from "@/data/admin";
import type { AdminUser, UserRole } from "@/types/admin";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";

const MODAL_SPRING = { type: "spring" as const, stiffness: 320, damping: 26 };

interface AdminChangeRoleModalProps {
  user: AdminUser | null;
  saving: boolean;
  error: string | null;
  onDismissError: () => void;
  onClose: () => void;
  onSubmit: (role: UserRole) => void;
}

export function AdminChangeRoleModal({
  user,
  saving,
  error,
  onDismissError,
  onClose,
  onSubmit,
}: AdminChangeRoleModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserRole>("DEVELOPER");

  if (user && user.id !== selectedId) {
    setSelectedId(user.id);
    setSelected(user.role);
  }
  if (!user && selectedId !== null) {
    setSelectedId(null);
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

  return (
    <AnimatePresence>
      {user ? (
        <motion.div
          key="change-role-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => !saving && onClose()}
          className="fixed inset-0 left-[260px] top-[72px] z-30 flex items-center justify-center overflow-y-auto bg-basin/75 p-4 backdrop-blur-sm"
        >
          <motion.section
            key="change-role-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-role-title"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={MODAL_SPRING}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-[640px] rounded-[24px] border border-steel bg-navy p-8 shadow-modal-glow"
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-ice/40 to-transparent"
            />
            <header className="flex items-start justify-between">
              <div>
                <p className="font-mono text-label-sm uppercase tracking-widest text-teal">
                  {ADMIN_ROLE_MODAL_ROW.kicker}
                </p>
                <h2 id="admin-role-title" className="mt-2 font-display text-headline-md font-bold text-foam">
                  {ADMIN_ROLE_MODAL_ROW.title}
                </h2>
                <p className="mt-1 font-mono text-code-md text-mist">
                  <span className="text-cinder">{ADMIN_ROLE_MODAL_ROW.targetLabel}</span> {user.name} (
                  {user.email})
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                aria-label={ADMIN_ROLE_MODAL_ROW.cancelLabel}
                className="flex h-9 w-9 items-center justify-center rounded-full text-mist transition-colors hover:bg-basin/60 hover:text-foam disabled:opacity-50"
              >
                <MaterialIcon name="close" className="text-[20px]" />
              </button>
            </header>

            <div
              role="radiogroup"
              aria-label={ADMIN_ROLE_MODAL_ROW.title}
              className="mt-6 flex flex-col gap-3"
            >
              {ADMIN_ROLE_OPTIONS.map((option) => {
                const isSelected = selected === option.id;
                const isCurrent = option.id === user.role;
                const chip = isCurrent ? option.currentChip : option.idleChip;
                return (
                  <motion.button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelected(option.id)}
                    className={cn(
                      "relative flex items-center gap-4 overflow-hidden rounded-2xl border px-5 py-4 text-left transition-colors",
                      isSelected
                        ? "border-ice/50 bg-surface-mid shadow-teal-glow"
                        : "border-steel/70 bg-panel/40 hover:border-steel",
                    )}
                  >
                    {isSelected ? (
                      <motion.span
                        layoutId="admin-role-active-rail"
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-tide"
                      />
                    ) : null}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-steel/60",
                        option.tileClasses,
                      )}
                    >
                      <MaterialIcon name={option.icon} className="text-[20px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-headline-sm font-bold text-foam">
                          {option.title}
                        </span>
                        {chip ? (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 font-mono text-label-sm uppercase tracking-wider",
                              isCurrent
                                ? "bg-teal/15 text-tide"
                                : "border border-champagne/30 bg-champagne/10 text-champagne",
                            )}
                          >
                            {chip}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block font-display text-body-sm text-mist">
                        {option.description}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                        isSelected ? "border-teal bg-teal text-navy" : "border-steel bg-transparent",
                      )}
                    >
                      <AnimatePresence>
                        {isSelected ? (
                          <motion.span
                            key={`admin-role-check-${option.id}`}
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.4 }}
                            transition={{ duration: 0.18 }}
                            className="flex"
                          >
                            <MaterialIcon name="check" className="text-[15px]" fill />
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-champagne/25 bg-champagne/[0.06] px-4 py-3">
              <MaterialIcon name={ADMIN_ROLE_MODAL_ROW.advisoryIcon} className="mt-0.5 text-[18px] text-champagne" />
              <div>
                <p className="font-mono text-label-sm uppercase tracking-wider text-champagne">
                  {ADMIN_ROLE_MODAL_ROW.advisoryLabel}
                </p>
                <p className="mt-0.5 font-display text-body-sm text-champagne-bright/90">
                  {ADMIN_ROLE_MODAL_ROW.advisoryCopy}
                </p>
              </div>
            </div>

            <AnimatePresence>
              {error ? (
                <motion.div
                  key="admin-role-error"
                  role="alert"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="mt-4 flex items-start gap-3 rounded-2xl border border-crimson/50 bg-crimson/15 px-4 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-crimson text-frost">
                    <MaterialIcon name="priority_high" className="text-[17px]" fill />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-label-sm uppercase tracking-wider text-crimson">
                      {ADMIN_ROLE_MODAL_ROW.errorHeading}
                    </p>
                    <p className="mt-0.5 font-display text-body-sm text-crimson/90">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onDismissError}
                    aria-label={ADMIN_ROLE_MODAL_ROW.errorCloseLabel}
                    className="shrink-0 rounded-full p-1 text-crimson transition-colors hover:bg-crimson/20"
                  >
                    <MaterialIcon name="close" className="text-[16px]" />
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <footer className="mt-6 flex items-center justify-end gap-3 border-t border-steel/40 pt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-full px-5 py-2.5 font-display text-body-md text-champagne transition-colors hover:bg-champagne/10 disabled:opacity-50"
              >
                {ADMIN_ROLE_MODAL_ROW.cancelLabel}
              </button>
              <button
                type="button"
                disabled={saving || selected === user.role}
                onClick={() => onSubmit(selected)}
                className="flex h-11 items-center gap-2 rounded-full bg-ice px-6 font-display text-body-md font-bold text-navy shadow-lg shadow-ice/20 transition-colors hover:bg-ice-bright disabled:opacity-50"
              >
                <MaterialIcon
                  name={saving ? "progress_activity" : ADMIN_ROLE_MODAL_ROW.submitIcon}
                  className={cn("text-[18px]", saving && "animate-spin")}
                />
                {ADMIN_ROLE_MODAL_ROW.submitLabel}
              </button>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
