// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { ProjectCard } from "@/components/dashboard/project-card";
import type { ProjectRow } from "@/types/dashboard";
import { stubMotionEnvironment } from "@/tests/motion-stubs";

vi.mock("next/link", () => ({
  default: ({ href, className, children }: { href: string; className?: string; children?: React.ReactNode }) =>
    React.createElement("a", { href, className }, children),
}));

const SAMPLE_PROJECT_ROW: ProjectRow = {
  id: "fixture-store",
  name: "fixture-store",
  description: "Fixture storefront service used to pin the mockup card anatomy.",
  environment: "staging",
  createdAt: "Created Oct 12, 2026",
};

beforeAll(() => {
  stubMotionEnvironment();
});

afterEach(cleanup);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("project card", () => {
  it("renders the row content with its environment chip and creation date", () => {
    render(<ProjectCard row={SAMPLE_PROJECT_ROW} />);
    expect(screen.getByText("fixture-store")).toBeTruthy();
    expect(screen.getByText("Staging")).toBeTruthy();
    expect(screen.getByText("Created Oct 12, 2026")).toBeTruthy();
    expect(screen.getByText("Fixture storefront service used to pin the mockup card anatomy.")).toBeTruthy();
  });

  it("marks the actions menu icon with an accessible label", () => {
    render(<ProjectCard row={SAMPLE_PROJECT_ROW} />);
    const kebab = screen.getByRole("button", { name: "Project actions" });
    expect(kebab.getAttribute("aria-expanded")).toBe("false");
    expect(kebab.getAttribute("aria-haspopup")).toBe("menu");
  });

  it("opens the actions menu with edit and delete entries, then closes it", async () => {
    render(<ProjectCard row={SAMPLE_PROJECT_ROW} />);
    fireEvent.click(screen.getByRole("button", { name: "Project actions" }));
    expect(screen.getByRole("button", { name: "Edit" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Project actions" }).getAttribute("aria-expanded"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Edit" })).toBeNull(),
    );
  });
});
