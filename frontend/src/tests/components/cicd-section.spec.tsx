// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ status: "NOT_INSTALLED" }));

vi.mock("@/hooks/use-cicd", () => ({
  usePreviewCicdQuery: () => ({
    data: {
      data: {
        workflowPath: ".github/workflows/build-images.yml",
        workflow: "name: build",
        components: [{ name: "web", rootPath: "web", dockerfilePath: "web/Dockerfile", image: "ghcr.io/acme/web:plan-v1" }],
        files: ["web/Dockerfile", ".github/workflows/build-images.yml"],
        warnings: [],
      },
    },
    isError: false,
    refetch: vi.fn(),
  }),
  useGetCicdBuildStatusQuery: () => ({
    data: {
      data: {
        workflowPath: ".github/workflows/build-images.yml",
        workflowInstalled: state.status !== "NOT_INSTALLED",
        workflowMatchesPlan: true,
        status: state.status,
        run: null,
      },
    },
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
  useCreateCicdPullRequestMutation: () => [vi.fn(), { isLoading: false }],
  useRequestCicdBuildMutation: () => [vi.fn(), { isLoading: false }],
}));

import { CicdSection } from "@/components/project-detail/cicd-section";

afterEach(cleanup);

describe("CI/CD section", () => {
  it("asks for a pull request while the workflow is not installed", () => {
    state.status = "NOT_INSTALLED";
    render(<CicdSection projectId="p" planId="plan" approved />);
    expect(screen.getByRole("status").textContent).toBe("Workflow not installed");
    expect(screen.getByRole("button", { name: /Create pull request/ })).toBeTruthy();
    expect(screen.getByText("ghcr.io/acme/web:plan-v1")).toBeTruthy();
    expect(screen.getByText("What the pull request adds")).toBeTruthy();
  });

  it("offers the build once the workflow is installed", () => {
    state.status = "NOT_STARTED";
    render(<CicdSection projectId="p" planId="plan" approved />);
    expect(screen.getByRole("status").textContent).toBe("Ready to build");
    expect(screen.getByRole("button", { name: /Run Docker build/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Create pull request/ })).toBeNull();
  });
});
