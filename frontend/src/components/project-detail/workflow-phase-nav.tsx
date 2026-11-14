"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";
import { phaseStatus } from "@/utils/workflow-steps";
import type { ReactNode } from "react";
import type { WorkflowPhase, WorkflowPhaseStatus, WorkflowStepView } from "@/types/workflow";

const PHASE_BADGES: Record<WorkflowPhaseStatus, (done: number, total: number) => ReactNode> = {
  done: () => (
    <span className="flex size-5 items-center justify-center rounded-full bg-mint/15 text-mint">
      <MaterialIcon name="check" className="text-[13px]" />
    </span>
  ),
  locked: () => <MaterialIcon name="lock" className="text-[15px] text-cinder" />,
  progress: (done, total) => (
    <span className="rounded-full bg-surface-high px-2 py-0.5 font-mono text-label-sm text-mist">
      {done}/{total}
    </span>
  ),
};

interface WorkflowPhaseNavProps<Id extends string, PhaseId extends string> {
  phases: WorkflowPhase<Id, PhaseId>[];
  steps: WorkflowStepView<Id>[];
  activePhase: PhaseId | undefined;
  onSelect: (phase: WorkflowPhase<Id, PhaseId>) => void;
}

export function WorkflowPhaseNav<Id extends string, PhaseId extends string>({
  phases,
  steps,
  activePhase,
  onSelect,
}: WorkflowPhaseNavProps<Id, PhaseId>) {
  const uid = useId();

  return (
    <nav aria-label="Workflow phases" className="flex gap-1 overflow-x-auto border-b border-steel/40">
      {phases.map((phase) => {
        const phaseSteps = steps.filter((step) => phase.stepIds.includes(step.id));
        const done = phaseSteps.filter((step) => step.state === "complete").length;
        const status = phaseStatus(phaseSteps);
        const selected = phase.id === activePhase;
        const first = phaseSteps[0]?.number;
        const last = phaseSteps.at(-1)?.number;
        return (
          <button
            key={phase.id}
            type="button"
            aria-current={selected ? "step" : undefined}
            onClick={() => onSelect(phase)}
            className={cn(
              "relative flex shrink-0 cursor-pointer items-center gap-2.5 px-4 py-2.5 font-display text-body-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/40",
              selected ? "text-foam" : "text-mist hover:text-foam",
              status === "locked" && !selected && "text-cinder",
            )}
          >
            <span className="flex flex-col items-start leading-tight">
              {phase.label}
              <span className="font-mono text-label-sm text-cinder">
                {first === last ? first : `${first}–${last}`}
              </span>
            </span>
            {PHASE_BADGES[status](done, phaseSteps.length)}
            {selected ? (
              <motion.span
                layoutId={`${uid}-underline`}
                className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-ice"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
