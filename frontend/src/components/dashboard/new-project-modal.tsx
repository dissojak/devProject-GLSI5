"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { cn } from "@/utils/class-names";
import { ENVIRONMENT_LABELS } from "@/data/dashboard";
import {
  ENVIRONMENT_OPTION_ROWS,
  PROJECT_MODAL_ROW,
} from "@/data/dashboard-form";
import type { EnvironmentTone } from "@/types/dashboard";
import { MaterialIcon } from "@/shared/material-icon";
import { Button } from "@/shared/button";

interface NewProjectModalProps {
  onClose: () => void;
  existingNames: string[];
  onComplete?: (values: {
    name: string;
    description: string;
    environment: EnvironmentTone;
  }) => void;
}

const ENV_SELECTION_BASE =
  "flex h-12 w-full items-center justify-between rounded-xl border border-steel bg-basin px-4 outline-none transition-all hover:border-teal focus:border-teal";

const NAME_INPUT_BASE =
  "h-12 w-full rounded-xl border border-steel bg-basin px-4 font-mono text-code-md text-foam outline-none transition-all placeholder:text-mist/60 focus:border-teal focus:ring-1 focus:ring-teal";

function ConflictingProject({ name }: { name: string }) {
  return (
    <div
      id="project-name-conflict"
      className="mt-2.5 flex flex-col gap-1.5 rounded-xl border border-crimson/40 bg-basin/80 p-3"
    >
      <div className="flex items-center justify-between font-mono text-label-md text-mist">
        <span className="uppercase">{PROJECT_MODAL_ROW.conflictHeading}</span>
        <span className="text-crimson">{PROJECT_MODAL_ROW.conflictCode}</span>
      </div>
      <div className="relative">
        <input
          readOnly
          value={name}
          aria-label={PROJECT_MODAL_ROW.conflictCodeLabel}
          className="h-11 w-full cursor-default rounded-[10px] border border-crimson bg-basin px-3.5 font-mono text-code-md text-crimson outline-none select-none"
        />
        <MaterialIcon name="error" className="absolute right-3 top-2.5 text-[18px] text-crimson" />
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 font-display text-body-sm text-crimson">
        <MaterialIcon name="warning" className="shrink-0 text-[15px]" />
        <span>{PROJECT_MODAL_ROW.conflictMessage}</span>
      </div>
    </div>
  );
}

function EnvironmentMenu({
  open,
  selected,
  onSelect,
}: {
  open: boolean;
  selected: EnvironmentTone;
  onSelect: (tone: EnvironmentTone) => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute inset-x-0 top-[52px] z-20 overflow-hidden rounded-xl bg-basin py-1 shadow-2xl"
        >
          <div className="border-b border-steel/40 px-3 py-2 font-mono text-label-sm uppercase text-cinder">
            {PROJECT_MODAL_ROW.environmentMenuHeading}
          </div>
          {ENVIRONMENT_OPTION_ROWS.map((row) => {
            const active = row.id === selected;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => onSelect(row.id)}
                className="group flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-panel"
              >
                <div className="flex items-center gap-2.5">
                  <span className={cn("h-2 w-2 rounded-full", row.dotModerator)} />
                  <span
                    className={cn(
                      "font-display text-body-md group-hover:text-foam",
                      active ? "text-frost" : "text-mist",
                    )}
                  >
                    {row.label}
                  </span>
                </div>
                {active ? (
                  <MaterialIcon name="check" className="text-[16px] text-ice" />
                ) : (
                  <span className="font-mono text-label-sm text-cinder">{row.badge}</span>
                )}
              </button>
            );
          })}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function NewProjectModal({ onClose, existingNames, onComplete }: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [environment, setEnvironment] = useState<EnvironmentTone>("development");
  const [envMenuOpen, setEnvMenuOpen] = useState(false);
  const conflict = existingNames.some((existing) => existing === name.trim().toLowerCase());
  const selectedOption = ENVIRONMENT_OPTION_ROWS.find(
    (row) => row.id === environment,
  );

  function Submit(event: FormEvent) {
    event.preventDefault();
    if (!conflict) {
      onComplete?.({ name: name.trim(), description, environment });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 left-[260px] top-[72px] z-30 flex items-center justify-center overflow-y-auto bg-basin/75 p-4 backdrop-blur-sm"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={PROJECT_MODAL_ROW.title}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[520px] rounded-[20px] border border-steel bg-panel p-8 shadow-modal-glow"
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-teal/40 to-transparent"
        />
        <div className="flex items-center justify-between border-b border-steel/40 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-basin border border-steel">
              <MaterialIcon name="rocket_launch" className="text-[19px] text-ice" />
            </div>
            <h2 className="font-display text-headline-md font-bold text-foam">
              {PROJECT_MODAL_ROW.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={PROJECT_MODAL_ROW.closeLabel}
            title={PROJECT_MODAL_ROW.closeLabel}
            className="flex h-9 w-9 items-center justify-center rounded-full text-mist transition-colors hover:bg-basin/60 hover:text-foam"
          >
            <MaterialIcon name="close" className="text-[20px]" />
          </button>
        </div>
        <form className="flex flex-col gap-5 pt-6" onSubmit={Submit}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="project-name-input"
                className="flex items-center gap-1 font-display text-body-md font-semibold text-foam"
              >
                {PROJECT_MODAL_ROW.nameLabel}
                <span className="font-mono text-crimson">
                  {PROJECT_MODAL_ROW.nameRequired}
                </span>
              </label>
              <span className="font-mono text-label-sm uppercase text-mist">
                {PROJECT_MODAL_ROW.slugHint}
              </span>
            </div>
            <div className="relative">
              <input
                id="project-name-input"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={PROJECT_MODAL_ROW.namePlaceholder}
                aria-invalid={conflict}
                aria-describedby={conflict ? "project-name-conflict" : undefined}
                className={NAME_INPUT_BASE}
              />
              <MaterialIcon
                name="check_circle"
                className="absolute right-3.5 top-3 text-[18px] text-teal"
              />
            </div>
            {conflict ? <ConflictingProject name={name.trim()} /> : null}
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="project-description-input"
              className="flex items-center gap-1.5 font-display text-body-md font-semibold text-foam"
            >
              {PROJECT_MODAL_ROW.descriptionLabel}
              <span className="font-display text-body-sm font-normal text-mist">
                {PROJECT_MODAL_ROW.descriptionHint}
              </span>
            </label>
            <textarea
              id="project-description-input"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={PROJECT_MODAL_ROW.descriptionPlaceholder}
              className="w-full resize-none rounded-xl bg-basin p-3.5 font-display text-body-md text-foam outline-none transition-all placeholder:text-mist/50 focus:border-teal focus:ring-1 focus:ring-teal"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span
              id="environment-label"
              className="font-display text-body-md font-semibold text-foam"
            >
              {PROJECT_MODAL_ROW.environmentLabel}
            </span>
            <div className="relative" role="group" aria-labelledby="environment-label">
              <button
                type="button"
                aria-expanded={envMenuOpen}
                aria-haspopup="listbox"
                aria-labelledby="environment-value environment-label"
                onClick={() => setEnvMenuOpen((open) => !open)}
                className={ENV_SELECTION_BASE}
              >
                <span id="environment-value" className="flex items-center gap-2.5">
                  <span className={cn("h-2.5 w-2.5 rounded-full", selectedOption?.dotModerator)} />
                  <span className="font-display text-body-md font-medium text-foam">
                    {ENVIRONMENT_LABELS[environment]}
                  </span>
                </span>
                <span className="flex items-center gap-2 text-cinder">
                  <span className="font-mono text-label-sm uppercase opacity-75">
                    {PROJECT_MODAL_ROW.environmentHint}
                  </span>
                  <motion.span
                    animate={{ rotate: envMenuOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <MaterialIcon name="expand_more" className="text-[20px]" />
                  </motion.span>
                </span>
              </button>
              <EnvironmentMenu
                open={envMenuOpen}
                selected={environment}
                onSelect={(tone) => {
                  setEnvironment(tone);
                  setEnvMenuOpen(false);
                }}
              />
            </div>
          </div>
          <div className="mt-1 flex items-center justify-end gap-3 border-t border-steel/50 pt-4">
            <Button variant="champagne" onClick={onClose} className="h-10 px-5">
              {PROJECT_MODAL_ROW.cancelLabel}
            </Button>
            <Button
              type="submit"
              className="h-10 gap-2 px-6 font-bold shadow-ice-submit hover:shadow-ice-halo"
            >
              <MaterialIcon name={PROJECT_MODAL_ROW.submitIcon} className="text-[18px]" />
              <span>{PROJECT_MODAL_ROW.submitLabel}</span>
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
