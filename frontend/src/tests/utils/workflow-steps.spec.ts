import { describe, expect, it } from "vitest";
import {
  PROJECT_LOCK_REASONS,
  PROJECT_PHASES,
  PROJECT_STEP_RULES,
  PROJECT_WORKFLOW_STEPS,
} from "@/data/project-workflow";
import {
  phaseEntryStep,
  phaseOfStep,
  phaseStatus,
  resolveWorkflowSteps,
  resumeStepIndex,
  shouldAutoAdvance,
} from "@/utils/workflow-steps";
import type { ProjectRequirement } from "@/types/workflow";

const NOTHING: Record<ProjectRequirement, boolean> = {
  verifiedRepository: false,
  completedAnalysis: false,
  reviewedRecommendations: false,
  dockerReady: false,
  approvedPlan: false,
  validManifests: false,
};

function resolve(met: Partial<Record<ProjectRequirement, boolean>>) {
  return resolveWorkflowSteps(
    PROJECT_WORKFLOW_STEPS,
    PROJECT_STEP_RULES,
    { ...NOTHING, ...met },
    PROJECT_LOCK_REASONS,
  );
}

function statesOf(steps: ReturnType<typeof resolve>) {
  return Object.fromEntries(steps.map((step) => [step.id, step.state]));
}

describe("project workflow steps", () => {
  it("numbers the workflow 01 to 10, with recommendations as 03b, and one rule per step", () => {
    expect(PROJECT_WORKFLOW_STEPS.map((step) => step.number)).toEqual([
      "01", "02", "03", "03b", "04", "05", "06", "07", "08", "09", "10",
    ]);
    expect(PROJECT_STEP_RULES.map((rule) => rule.id)).toEqual(
      PROJECT_WORKFLOW_STEPS.map((step) => step.id),
    );
  });

  it("locks everything after step 01 until the repository is verified", () => {
    const steps = resolve({});
    expect(steps[0].state).toBe("available");
    expect(steps.slice(1).every((step) => step.state === "locked")).toBe(true);
    expect(steps[1].lockedReason).toBe(PROJECT_LOCK_REASONS.verifiedRepository);
    expect(resumeStepIndex(steps)).toBe(0);
  });

  it("opens recommendations, Docker and the plan once an analysis completes", () => {
    const steps = resolve({ verifiedRepository: true, completedAnalysis: true });
    expect(statesOf(steps)).toMatchObject({
      repository: "complete",
      analysis: "complete",
      recommendations: "available",
      docker: "available",
      plan: "available",
      cicd: "locked",
    });
    expect(resumeStepIndex(steps)).toBe(2);
    expect(steps[2].id).toBe("docker");
  });

  it("resumes after the furthest completed step", () => {
    const steps = resolve({ verifiedRepository: true, completedAnalysis: true, approvedPlan: true });
    expect(statesOf(steps)).toMatchObject({
      plan: "complete",
      cicd: "available",
      manifests: "available",
      "server-validation": "locked",
      deploy: "locked",
    });
    expect(steps[resumeStepIndex(steps)].id).toBe("cicd");
  });

  it("unlocks validation and deploy once manifests are valid", () => {
    const steps = resolve({
      verifiedRepository: true,
      completedAnalysis: true,
      approvedPlan: true,
      validManifests: true,
    });
    expect(statesOf(steps)).toMatchObject({
      manifests: "complete",
      "server-validation": "available",
      deploy: "available",
    });
    expect(steps[resumeStepIndex(steps)].id).toBe("server-validation");
  });
});

describe("auto-advance", () => {
  const [repository, analysis] = resolve({ verifiedRepository: true });
  const done = { ...analysis, state: "complete" as const };

  it("advances when the active step just completed and the next step is open", () => {
    expect(shouldAutoAdvance(analysis, done, { ...repository, state: "available" })).toBe(true);
  });

  it("stays put when the step was already complete or the next step is locked", () => {
    expect(shouldAutoAdvance(done, done, { ...repository, state: "available" })).toBe(false);
    expect(shouldAutoAdvance(analysis, done, { ...repository, state: "locked" })).toBe(false);
    expect(shouldAutoAdvance(analysis, done, undefined)).toBe(false);
  });
});

describe("workflow phases", () => {
  const railIds = PROJECT_WORKFLOW_STEPS.map((step) => step.id).filter((id) => id !== "repository");
  const steps = resolve({ verifiedRepository: true, completedAnalysis: true, approvedPlan: true });
  const [analyse, recommendations, build, kubernetes, operate] = PROJECT_PHASES;

  it("covers every step exactly once, in workflow order", () => {
    expect(PROJECT_PHASES.flatMap((phase) => phase.stepIds)).toEqual(
      PROJECT_WORKFLOW_STEPS.map((step) => step.id),
    );
    expect(phaseOfStep(PROJECT_PHASES, "deploy")).toBe("kubernetes");
  });

  it("summarises each phase as done, in progress or locked", () => {
    const of = (ids: readonly string[]) => steps.filter((step) => ids.includes(step.id));
    expect(phaseStatus(of(analyse.stepIds))).toBe("progress");
    expect(phaseStatus(of(recommendations.stepIds))).toBe("progress");
    expect(phaseStatus(of(build.stepIds))).toBe("progress");
    expect(phaseStatus(resolve({}).filter((step) => kubernetes.stepIds.includes(step.id)))).toBe("locked");
    expect(phaseStatus(of(operate.stepIds))).toBe("progress");
  });

  it("enters a phase at its first unfinished step", () => {
    expect(phaseEntryStep(steps, build, railIds)).toBe("cicd");
    expect(phaseEntryStep(steps, kubernetes, railIds)).toBe("manifests");
    expect(phaseEntryStep(steps, analyse, railIds)).toBe("docker");
    expect(phaseEntryStep(steps, recommendations, railIds)).toBe("recommendations");
  });
});
