import type {
  WorkflowPhase,
  WorkflowPhaseStatus,
  WorkflowStepDefinition,
  WorkflowStepView,
} from "@/types/workflow";

interface StepRule<Requirement extends string> {
  id: string;
  requires?: Requirement;
  completeWhen?: Requirement;
}

export function resolveWorkflowSteps<Id extends string, Requirement extends string>(
  steps: WorkflowStepDefinition<Id>[],
  rules: StepRule<Requirement>[],
  met: Record<Requirement, boolean>,
  lockReasons: Record<Requirement, string>,
): WorkflowStepView<Id>[] {
  return steps.map((step) => {
    const rule = rules.find((candidate) => candidate.id === step.id);
    const blocker = rule?.requires && !met[rule.requires] ? rule.requires : undefined;
    if (blocker) {
      return { ...step, state: "locked", lockedReason: lockReasons[blocker] };
    }
    const complete = rule?.completeWhen ? met[rule.completeWhen] : false;
    return { ...step, state: complete ? "complete" : "available" };
  });
}

export function resumeStepIndex(steps: WorkflowStepView[]): number {
  const next = steps.map((step) => step.state).lastIndexOf("complete") + 1;
  const candidate = steps[next];
  if (candidate && candidate.state !== "locked") return next;
  return Math.max(0, steps.findIndex((step) => step.state === "available"));
}

export function shouldAutoAdvance(
  before: WorkflowStepView | undefined,
  now: WorkflowStepView | undefined,
  next: WorkflowStepView | undefined,
): boolean {
  const justCompleted = now?.state === "complete" && before?.state !== "complete";
  return justCompleted && next !== undefined && next.state !== "locked";
}

export function phaseEntryStep<Id extends string>(
  steps: WorkflowStepView<Id>[],
  phase: WorkflowPhase<Id>,
  selectableIds: readonly Id[],
): Id | undefined {
  const candidates = steps.filter(
    (step) => phase.stepIds.includes(step.id) && selectableIds.includes(step.id),
  );
  const open = candidates.find((step) => step.state === "available");
  const reachable = candidates.find((step) => step.state !== "locked");
  return (open ?? reachable ?? candidates[0])?.id;
}

export function phaseOfStep<Id extends string, PhaseId extends string>(
  phases: WorkflowPhase<Id, PhaseId>[],
  id: Id,
): PhaseId | undefined {
  return phases.find((phase) => phase.stepIds.includes(id))?.id;
}

export function phaseStatus(steps: WorkflowStepView[]): WorkflowPhaseStatus {
  if (steps.length > 0 && steps.every((step) => step.state === "complete")) return "done";
  if (steps.every((step) => step.state === "locked")) return "locked";
  return "progress";
}

export function stepIdFrom<Id extends string>(
  steps: readonly WorkflowStepDefinition<Id>[],
  value: string | null,
): Id | null {
  return steps.find((step) => step.id === value)?.id ?? null;
}
