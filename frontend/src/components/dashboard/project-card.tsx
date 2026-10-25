"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/utils/class-names";
import { CARD_ACTION_ROW, ENVIRONMENT_LABELS } from "@/data/dashboard";
import type { EnvironmentTone, ProjectRow } from "@/types/dashboard";
import { MaterialIcon } from "@/shared/material-icon";

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const ENV_CHIP_CLASSES: Record<EnvironmentTone, string> = {
  development: "bg-lagoon/30 text-tide",
  production: "bg-champagne-soft/20 text-champagne-bright",
  staging: "bg-champagne-soft/30 text-champagne-dim",
};

function CardMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute right-0 top-8 z-30 flex w-36 flex-col gap-0.5 rounded-xl bg-abyss p-1.5 shadow-2xl"
        >
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left font-display text-body-sm text-frost transition-colors hover:bg-surface-mid"
          >
            <MaterialIcon name="edit" className="text-[16px]" />
            <span>{CARD_ACTION_ROW.editLabel}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left font-display text-body-sm text-rose transition-colors hover:bg-ember/20"
          >
            <MaterialIcon name="delete" className="text-[16px]" />
            <span>{CARD_ACTION_ROW.deleteLabel}</span>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function ProjectCard({ row }: { row: ProjectRow }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      variants={CARD_VARIANTS}
      className="relative flex min-h-[178px] flex-col justify-between rounded-2xl bg-surface-high/95 p-5 shadow-lg transition-shadow duration-200 hover:shadow-teal-glow"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="truncate font-display text-[18px] font-bold text-frost">
              {row.name}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 font-mono text-label-sm font-semibold tracking-wide",
                ENV_CHIP_CLASSES[row.environment],
              )}
            >
              {ENVIRONMENT_LABELS[row.environment]}
            </span>
          </div>
          <div className="relative">
            <button
              type="button"
              aria-label={CARD_ACTION_ROW.menuLabel}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((open) => !open)}
              className={cn(
                "-mr-1 rounded-md p-1 transition-colors",
                menuOpen ? "bg-surface-highest text-frost" : "text-smoke hover:text-frost",
              )}
            >
              <MaterialIcon name="more_vert" className="text-[18px]" />
            </button>
            <CardMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
          </div>
        </div>
        <p className="mt-3 font-display text-body-md text-smoke line-clamp-2">
          {row.description}
        </p>
      </div>
      <div className="mt-6 flex items-center gap-2 font-mono text-label-md text-smoke">
        <MaterialIcon name="calendar_today" className="text-[15px]" />
        <span>{row.createdAt}</span>
      </div>
    </motion.div>
  );
}
