"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ADMIN_ACTION_KEYBOARD_LABEL,
  ADMIN_MENU_DISABLED_REASONS,
  ADMIN_USERS_MENU_ROWS,
} from "@/data/admin";
import type { AdminMenuActionId, AdminMenuRow, AdminUser } from "@/types/admin";
import { adminMenuActionOrder, adminMenuStates } from "@/utils/admin-actions";
import type { MenuAnchor } from "@/utils/menu-anchor";
import { menuAnchor } from "@/utils/menu-anchor";
import { cn } from "@/utils/class-names";

const MENU_TONE_LABELS: Record<AdminMenuRow["tone"], string> = {
  ice: "text-foam",
  crimson: "text-crimson",
  mint: "text-mint",
};

const MENU_SPRING = { type: "spring" as const, stiffness: 400, damping: 30 };

function disabledReason(action: AdminMenuActionId, user: AdminUser, selfId: string): string {
  const reasons = ADMIN_MENU_DISABLED_REASONS[action];
  const isSelf = user.id === selfId;
  if (isSelf) {
    return reasons.self ?? "";
  }
  return reasons.status ?? "";
}

function targetIsInside(event: globalThis.MouseEvent, ...roots: Array<Element | null>): boolean {
  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }
  return roots.some((root) => root?.contains(target) ?? false);
}

interface AdminRowMenuProps {
  user: AdminUser;
  selfId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: AdminMenuActionId, user: AdminUser) => void;
}

/**
 * Kebab dropdown. The panel is portaled to `document.body` with fixed
 * positioning so it can never be clipped by the table panel's rounded
 * `overflow-hidden`; placement clears the trigger when there is room and
 * flips above it when a clipping ancestor sits too close below.
 */
export function AdminRowMenu({ user, selfId, open, onOpenChange, onAction }: AdminRowMenuProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const states = adminMenuStates(user, selfId);
  const rows = adminMenuActionOrder(user.status).map(
    (action) => ADMIN_USERS_MENU_ROWS.find((row) => row.id === action) ?? null,
  );

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: globalThis.MouseEvent) {
      if (!targetIsInside(event, rootRef.current, panelRef.current)) {
        onOpenChange(false);
      }
    }
    function handleKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }
    function discard() {
      onOpenChange(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", discard, { capture: true });
    window.addEventListener("resize", discard);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", discard, { capture: true });
      window.removeEventListener("resize", discard);
    };
  }, [open, onOpenChange]);

  function toggleOpen() {
    if (open) {
      onOpenChange(false);
      return;
    }
    setAnchor(
      menuAnchor(triggerRef.current, {
        width: window.innerWidth,
        height: window.innerHeight,
      }),
    );
    onOpenChange(true);
  }

  const style = anchor?.flipUp
    ? { right: anchor.right, bottom: anchor.bottomEdge }
    : { right: anchor?.right ?? 0, top: anchor?.topEdge ?? 0 };

  return (
    <div ref={rootRef} className="relative inline-flex justify-center">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ADMIN_ACTION_KEYBOARD_LABEL}
        onClick={toggleOpen}
        className="flex h-8 w-8 items-center justify-center rounded-full text-mist transition-colors hover:bg-surface-high hover:text-ice"
      >
        <span aria-hidden="true" className="material-symbols-outlined select-none text-[20px]">
          more_vert
        </span>
      </button>
      {open && anchor
        ? createPortal(
            <motion.div
              key="admin-row-menu-panel"
              ref={panelRef}
              role="menu"
              aria-label={`${ADMIN_ACTION_KEYBOARD_LABEL}: ${user.name}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={MENU_SPRING}
              style={{ ...style, position: "fixed", transformOrigin: anchor.flipUp ? "bottom right" : "top right" }}
              className="fixed z-50 min-w-[180px] rounded-xl border border-steel bg-surface-mid py-1 shadow-modal-glow"
            >
              {rows.map((row) =>
                row ? (
                  <div key={row.id}>
                    {row.dividerBefore ? <div className="mx-2 mb-1 h-px bg-steel/40" /> : null}
                    <button
                      type="button"
                      role="menuitem"
                      aria-disabled={states[row.id] || undefined}
                      title={states[row.id] ? disabledReason(row.id, user, selfId) : undefined}
                      onClick={() => {
                        if (states[row.id]) return;
                        onAction(row.id, user);
                      }}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-display text-body-md font-medium transition-colors",
                        MENU_TONE_LABELS[row.tone],
                        states[row.id]
                          ? "cursor-default opacity-40"
                          : cn(
                              row.tone === "ice" && "hover:bg-ice/[0.08]",
                              row.tone === "crimson" && "hover:bg-crimson/10",
                              row.tone === "mint" && "hover:bg-mint/10",
                            ),
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined select-none text-[18px]"
                      >
                        {row.icon}
                      </span>
                      {row.label}
                    </button>
                  </div>
                ) : null,
              )}
            </motion.div>,
            document.body,
          )
        : null}
    </div>
  );
}