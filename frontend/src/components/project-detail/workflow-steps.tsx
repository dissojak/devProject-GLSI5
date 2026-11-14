"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import type { Variants } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/shared/button";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";
import { shouldAutoAdvance } from "@/utils/workflow-steps";
import type { MaterialIconName } from "@/types/icons";
import type { WorkflowNavigation, WorkflowStepState, WorkflowStepView } from "@/types/workflow";

const MARKER_STYLES: Record<WorkflowStepState, string> = {
  complete: "border-mint/60 bg-mint/10 text-mint",
  available: "border-steel text-mist",
  locked: "border-steel/50 text-cinder",
};

const MARKER_ICONS: Record<WorkflowStepState, MaterialIconName | null> = {
  complete: "check",
  available: null,
  locked: "lock",
};

const RAIL_COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
};

const PANEL_VARIANTS: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -28 }),
};

function stateSignature(steps: WorkflowStepView[]): string {
  return steps.map((step) => step.state).join(",");
}

interface WorkflowStepsProps<Id extends string> {
  label: string;
  steps: WorkflowStepView<Id>[];
  panels: Record<Id, () => ReactNode>;
  initialIndex?: number;
  navigation?: WorkflowNavigation | null;
  onActiveChange?: (id: Id) => void;
  progress?: { complete: number; total: number };
  phaseOf?: Partial<Record<Id, string>>;
}

export function WorkflowSteps<Id extends string>({
  label,
  steps,
  panels,
  initialIndex = 0,
  navigation = null,
  onActiveChange,
  progress,
  phaseOf,
}: WorkflowStepsProps<Id>) {
  const uid = useId();
  const railRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ index: initialIndex, direction: 1 });
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [tracked, setTracked] = useState(steps);
  const [pending, setPending] = useState<{ index: number; message: string } | null>(null);
  const [handledToken, setHandledToken] = useState(navigation?.token);
  const active = steps[view.index] ?? steps[0];
  const previous = steps[view.index - 1];
  const next = steps[view.index + 1];
  const railEntries = steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => !phaseOf || phaseOf[step.id] === phaseOf[active.id]);
  const dense = railEntries.length > 3;
  const completed = steps.filter((step) => step.state === "complete").length;

  if (navigation && navigation.token !== handledToken) {
    setHandledToken(navigation.token);
    const target = steps.findIndex((step) => step.id === navigation.id);
    if (target >= 0 && target !== view.index) {
      setView({ index: target, direction: Math.sign(target - view.index) });
      setPending(null);
    }
  }

  if (stateSignature(tracked) !== stateSignature(steps)) {
    setTracked(steps);
    if (autoAdvance && next && shouldAutoAdvance(tracked[view.index], active, next)) {
      setPending({
        index: view.index + 1,
        message: `Step ${active.number} complete. Moved to step ${next.number}, ${next.label}.`,
      });
    }
  }

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => {
      setView({ index: pending.index, direction: 1 });
      setAnnouncement(pending.message);
      setPending(null);
      railRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [pending]);

  useEffect(() => {
    onActiveChange?.(active.id);
  }, [active.id, onActiveChange]);

  function goTo(index: number) {
    setPending(null);
    if (index === view.index) return;
    setView({ index, direction: Math.sign(index - view.index) });
    railRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }

  const tabId = (id: Id) => `${uid}-step-${id}`;
  const panelId = `${uid}-panel`;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <p className="font-display text-body-md font-semibold text-foam">{label}</p>
            <span className="rounded-full bg-surface-high px-2.5 py-0.5 font-mono text-label-sm text-mist">
              {progress?.complete ?? completed} of {progress?.total ?? steps.length} complete
            </span>
            {pending ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 font-mono text-label-sm text-ice"
              >
                <MaterialIcon name="progress_activity" className="animate-spin text-[14px]" />
                Moving to step {steps[pending.index]?.number}…
              </motion.span>
            ) : null}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoAdvance}
            onClick={() => {
              setAutoAdvance((value) => !value);
              setPending(null);
            }}
            className="flex cursor-pointer items-center gap-2 rounded-full px-1 py-1 font-display text-body-sm text-mist hover:text-foam focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/40"
          >
            <span
              className={cn(
                "relative flex h-5 w-9 items-center rounded-full border p-0.5 transition-colors",
                autoAdvance ? "justify-end border-ice/60 bg-ice/20" : "justify-start border-steel bg-basin",
              )}
            >
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 520, damping: 34 }}
                className={cn("size-3.5 rounded-full", autoAdvance ? "bg-ice" : "bg-mist")}
              />
            </span>
            Auto-advance
          </button>
        </div>
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
        <div
          ref={railRef}
          role="tablist"
          aria-label={label}
          className={cn(
            "scroll-mt-24 gap-1.5 rounded-2xl border border-steel/50 bg-basin p-1.5",
            dense ? "flex overflow-x-auto" : cn("grid", RAIL_COLUMNS[railEntries.length]),
          )}
        >
          {railEntries.map(({ step, index }) => {
            const selected = index === view.index;
            const icon = MARKER_ICONS[step.state];
            return (
              <button
                key={step.id}
                type="button"
                role="tab"
                id={tabId(step.id)}
                aria-selected={selected}
                aria-controls={panelId}
                onClick={() => goTo(index)}
                className={cn(
                  "group relative flex min-w-0 cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/40",
                  dense && "shrink-0 lg:flex-1 lg:shrink",
                )}
              >
                {selected ? (
                  <motion.span
                    layoutId={`${uid}-indicator`}
                    className="absolute inset-0 rounded-xl border border-ice/25 bg-panel shadow-md"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <span
                  className={cn(
                    "relative grid size-8 shrink-0 place-items-center rounded-full border font-mono text-label-sm font-bold transition-colors",
                    selected ? "border-ice bg-ice text-navy" : MARKER_STYLES[step.state],
                  )}
                >
                  {icon ? <MaterialIcon name={icon} className="text-[16px]" /> : step.number}
                </span>
                <span className="relative min-w-0">
                  <span
                    className={cn(
                      "block truncate font-display text-body-sm font-semibold transition-colors",
                      selected ? "text-foam" : "text-mist group-hover:text-foam",
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="block truncate font-mono text-label-sm text-cinder">
                    {dense ? `Step ${step.number}` : step.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-clip">
          <AnimatePresence mode="wait" initial={false} custom={view.direction}>
            <motion.div
              key={active.id}
              role="tabpanel"
              id={panelId}
              aria-labelledby={tabId(active.id)}
              custom={view.direction}
              variants={PANEL_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex flex-col gap-5"
            >
              {dense ? (
                <div className="flex items-center gap-3">
                  <span className="font-mono text-headline-sm font-bold text-ice">{active.number}</span>
                  <div className="min-w-0">
                    <p className="font-display text-headline-sm font-semibold text-foam">{active.label}</p>
                    <p className="font-display text-body-sm text-mist">{active.description}</p>
                  </div>
                </div>
              ) : null}
              {active.state === "locked" ? (
                <div className="flex items-start gap-3 rounded-xl border border-champagne/40 bg-champagne/10 p-5">
                  <MaterialIcon name="lock" className="text-[20px] text-champagne" />
                  <p className="font-display text-body-md text-champagne">{active.lockedReason}</p>
                </div>
              ) : (
                panels[active.id]()
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-steel/40 pt-4">
          {previous ? (
            <Button
              variant="teal"
              onClick={() => goTo(view.index - 1)}
              className="gap-1.5 px-4 py-2 text-body-sm"
            >
              <MaterialIcon name="arrow_back" className="text-[16px]" />
              {previous.number} · {previous.label}
            </Button>
          ) : (
            <span />
          )}
          {next ? (
            <Button onClick={() => goTo(view.index + 1)} className="gap-1.5 px-4 py-2 text-body-sm">
              Next: {next.number} · {next.label}
              <MaterialIcon name="arrow_forward" className="text-[16px]" />
            </Button>
          ) : null}
        </div>
      </div>
    </MotionConfig>
  );
}
