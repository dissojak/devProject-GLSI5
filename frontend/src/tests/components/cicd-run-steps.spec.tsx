// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CicdRunSteps } from "@/components/project-detail/cicd-run-steps";

afterEach(cleanup);

const JOB = {
  id: 7,
  name: "build-1-moviematchlibrary-frontend",
  status: "completed",
  conclusion: "failure",
  url: "https://github.com/acme/web/actions/runs/42/job/7",
  startedAt: "2026-11-14T10:00:00Z",
  completedAt: "2026-11-14T10:00:18Z",
  errorExcerpt: [
    { text: "npm error missing script: build", error: false },
    { text: "buildx failed with: exit code: 1", error: true },
  ],
  steps: [
    { number: 1, name: "Set up job", status: "completed", conclusion: "success", startedAt: "2026-11-14T10:00:00Z", completedAt: "2026-11-14T10:00:02Z" },
    { number: 5, name: "Build and publish", status: "completed", conclusion: "failure", startedAt: "2026-11-14T10:00:10Z", completedAt: "2026-11-14T10:00:12Z" },
  ],
};

describe("CI/CD run steps", () => {
  it("lists each step of a failed job, expanded, with durations", () => {
    const { container } = render(<CicdRunSteps jobs={[JOB]} />);
    expect(container.querySelector("details")?.open).toBe(true);
    expect(screen.getByText("build-1-moviematchlibrary-frontend")).toBeTruthy();
    expect(screen.getByText("18s")).toBeTruthy();
    expect(screen.getByText("Build and publish").className).toContain("text-crimson");
    expect(screen.getByRole("link", { name: /Open build-1-moviematchlibrary-frontend on GitHub/ })).toBeTruthy();
  });

  it("keeps a successful job collapsed and renders nothing without jobs", () => {
    const { container, rerender } = render(
      <CicdRunSteps jobs={[{ ...JOB, conclusion: "success" }]} />,
    );
    expect(container.querySelector("details")?.open).toBe(false);
    rerender(<CicdRunSteps jobs={[]} />);
    expect(container.querySelector("details")).toBeNull();
  });

  it("shows the error output right under the failed step", () => {
    render(<CicdRunSteps jobs={[JOB]} />);
    const items = screen.getAllByRole("listitem").map((item) => item.textContent ?? "");
    const failedIndex = items.findIndex((text) => text.startsWith("Build and publish"));
    expect(items[failedIndex + 1]).toContain("Error output");
    expect(screen.getByText("buildx failed with: exit code: 1").className).toContain("text-crimson");
    expect(screen.getByText("npm error missing script: build").className).toContain("text-mist");
  });
});
