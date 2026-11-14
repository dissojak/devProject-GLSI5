// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { WorkflowPhaseNav } from "@/components/project-detail/workflow-phase-nav";
import {
  PROJECT_LOCK_REASONS,
  PROJECT_PHASES,
  PROJECT_STEP_RULES,
  PROJECT_WORKFLOW_STEPS,
} from "@/data/project-workflow";
import { resolveWorkflowSteps } from "@/utils/workflow-steps";
import { stubMotionEnvironment } from "@/tests/motion-stubs";

const STEPS = resolveWorkflowSteps(
  PROJECT_WORKFLOW_STEPS,
  PROJECT_STEP_RULES,
  {
    verifiedRepository: true,
    completedAnalysis: true,
    reviewedRecommendations: false,
    dockerReady: true,
    approvedPlan: false,
    validManifests: false,
  },
  PROJECT_LOCK_REASONS,
);

beforeAll(() => {
  stubMotionEnvironment();
});

afterEach(cleanup);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("workflow phase nav", () => {
  it("shows each phase with its step range and progress", () => {
    render(<WorkflowPhaseNav phases={PROJECT_PHASES} steps={STEPS} activePhase="build" onSelect={() => {}} />);
    const build = screen.getByRole("button", { name: /Build/ });
    expect(build.getAttribute("aria-current")).toBe("step");
    expect(build.textContent).toContain("04–05");
    expect(build.textContent).toContain("0/2");
    expect(screen.getByRole("button", { name: /Analyse/ }).textContent).not.toContain("/");
  });

  it("selects a phase", () => {
    const onSelect = vi.fn();
    render(<WorkflowPhaseNav phases={PROJECT_PHASES} steps={STEPS} activePhase="build" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /Kubernetes/ }));
    expect(onSelect).toHaveBeenCalledWith(PROJECT_PHASES[3]);
  });
});
