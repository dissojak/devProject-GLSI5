// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { WorkflowChecklist } from "@/components/project-detail/workflow-checklist";
import {
  PROJECT_LOCK_REASONS,
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
    dockerReady: false,
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

describe("workflow checklist", () => {
  it("lists every workflow step with progress and the current step", () => {
    render(
      <WorkflowChecklist
        steps={STEPS}
        activeId="docker"
        selectableIds={["analysis", "docker", "plan"]}
        onSelect={() => {}}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(11);
    expect(screen.getByText("2/11")).toBeTruthy();
    expect(screen.getByRole("button", { current: "step" }).textContent).toContain("Docker preparation");
    expect(screen.queryByRole("button", { name: /GitHub repository/ })).toBeNull();
  });

  it("jumps to a step when it is selected", () => {
    const onSelect = vi.fn();
    render(
      <WorkflowChecklist
        steps={STEPS}
        activeId="docker"
        selectableIds={["analysis", "docker", "plan"]}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Deployment plan/ }));
    expect(onSelect).toHaveBeenCalledWith("plan");
  });
});
