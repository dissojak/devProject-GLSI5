"use client";

import { motion } from "motion/react";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";
import type { MaterialIconName } from "@/types/icons";
import type { WorkflowStepState, WorkflowStepView } from "@/types/workflow";

const MARKER_STYLES: Record<WorkflowStepState, string> = {
  complete: "border-mint bg-mint/15 text-mint",
  available: "border-steel bg-basin text-mist",
  locked: "border-steel/50 bg-basin text-cinder",
};

const MARKER_ICONS: Record<WorkflowStepState, MaterialIconName | null> = {
  complete: "check",
  available: null,
  locked: "lock",
};

interface WorkflowChecklistProps<Id extends string> {
  steps: WorkflowStepView<Id>[];
  activeId: Id | null;
  selectableIds: readonly Id[];
  onSelect: (id: Id) => void;
}

export function WorkflowChecklist<Id extends string>({
  steps,
  activeId,
  selectableIds,
  onSelect,
}: WorkflowChecklistProps<Id>) {
  const completed = steps.filter((step) => step.state === "complete").length;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-steel bg-panel p-6 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-headline-sm font-bold text-foam">Deployment pipeline</p>
        <span className="font-mono text-label-sm text-mist">
          {completed}/{steps.length}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-basin">
        <motion.div
          className="h-full origin-left rounded-full bg-mint"
          initial={false}
          animate={{ scaleX: completed / steps.length }}
          transition={{ type: "spring", stiffness: 160, damping: 26 }}
        />
      </div>
      <ol className="flex flex-col gap-0.5">
        {steps.map((step) => {
          const icon = MARKER_ICONS[step.state];
          const active = step.id === activeId;
          const content = (
            <>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-label-sm",
                  active ? "border-ice bg-ice text-navy" : MARKER_STYLES[step.state],
                )}
              >
                {icon && !active ? <MaterialIcon name={icon} className="text-[14px]" /> : step.number}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate font-display text-body-sm",
                  active || step.state === "complete" ? "text-foam" : "text-mist",
                )}
              >
                {step.label}
              </span>
              {active ? (
                <span className="font-mono text-label-sm text-ice">Current</span>
              ) : null}
            </>
          );
          return (
            <li key={step.id}>
              {selectableIds.includes(step.id) ? (
                <button
                  type="button"
                  onClick={() => onSelect(step.id)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-basin/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/40",
                    active && "bg-ice/5",
                  )}
                >
                  {content}
                </button>
              ) : (
                <div className="flex items-center gap-3 px-2 py-1.5">{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
