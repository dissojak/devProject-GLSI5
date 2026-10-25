// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { NewProjectModal } from "@/components/dashboard/new-project-modal";
import { PROJECT_MODAL_ROW } from "@/data/dashboard-form";
import type { EnvironmentTone } from "@/types/dashboard";
import { stubMotionEnvironment } from "@/tests/motion-stubs";

vi.mock("next/link", () => ({
  default: ({ href, className, children }: { href: string; className?: string; children?: React.ReactNode }) =>
    React.createElement("a", { href, className }, children),
}));

interface CompletionValues {
  name: string;
  description: string;
  environment: EnvironmentTone;
}

beforeAll(() => {
  stubMotionEnvironment();
});

afterEach(cleanup);

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderModal(
  existingNames: string[] = [],
  onComplete?: (values: CompletionValues) => void,
) {
  return render(
    <NewProjectModal onClose={vi.fn()} existingNames={existingNames} onComplete={onComplete} />,
  );
}

function submitModal() {
  const form = screen.getByRole("dialog").querySelector("form");
  if (!(form instanceof HTMLFormElement)) {
    throw new Error("New project form is missing");
  }
  fireEvent.submit(form);
}

describe("new project modal", () => {
  it("presents the mockup form with name, description, and environment", () => {
    renderModal();
    expect(screen.getByRole("dialog", { name: "New project" })).toBeTruthy();
    expect(screen.getByText("New project")).toBeTruthy();
    expect(screen.getByText("Slug compatible")).toBeTruthy();
    expect(screen.getByLabelText(/Project name/)).toBeTruthy();
    expect(screen.getByLabelText(/Description/)).toBeTruthy();
    expect(screen.getByText(PROJECT_MODAL_ROW.environmentLabel)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create project" })).toBeTruthy();
    expect(screen.getByRole("button", { name: PROJECT_MODAL_ROW.closeLabel })).toBeTruthy();
    expect(screen.getByRole("button", { name: PROJECT_MODAL_ROW.cancelLabel })).toBeTruthy();
  });

  it("surfaces the conflict preview for a supplied duplicate name", () => {
    renderModal(["blog-engine", "shopflow-store"]);
    expect(screen.queryByText(PROJECT_MODAL_ROW.conflictHeading)).toBeNull();
    fireEvent.change(screen.getByLabelText(/Project name/), {
      target: { value: "blog-engine" },
    });
    expect(screen.getByText(PROJECT_MODAL_ROW.conflictHeading)).toBeTruthy();
    expect(screen.getByText(PROJECT_MODAL_ROW.conflictCode)).toBeTruthy();
    expect(screen.getByText(PROJECT_MODAL_ROW.conflictMessage)).toBeTruthy();
    const nameInput = screen.getByLabelText(/Project name/);
    expect(nameInput.getAttribute("aria-invalid")).toBe("true");
    expect(nameInput.getAttribute("aria-describedby")).toBe("project-name-conflict");
    expect(screen.getByLabelText(PROJECT_MODAL_ROW.conflictCodeLabel)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Project name/), {
      target: { value: "waveform-api" },
    });
    expect(screen.queryByText(PROJECT_MODAL_ROW.conflictHeading)).toBeNull();
  });

  it("spins through the environment tiers and fires the completion seam", () => {
    const completions: CompletionValues[] = [];
    renderModal([], (values) => completions.push(values));
    fireEvent.change(screen.getByLabelText(/Project name/), {
      target: { value: "waveform-api" },
    });
    const toggle = screen.getByRole("button", { name: "Development Environment" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(PROJECT_MODAL_ROW.environmentMenuHeading)).toBeTruthy();
    expect(screen.getAllByText("PRE-PROD").length).toBeGreaterThan(0);
    expect(screen.getAllByText("LIVE").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /^Production/ }));
    expect(completions).toHaveLength(0);
    submitModal();
    expect(completions).toEqual([
      { name: "waveform-api", description: "", environment: "production" },
    ]);
  });

  it("keeps the completion seam silent while a conflict blocks submission", () => {
    const completions: CompletionValues[] = [];
    renderModal(["shopflow-store"], (values) => completions.push(values));
    fireEvent.change(screen.getByLabelText(/Project name/), {
      target: { value: "shopflow-store" },
    });
    expect(screen.getByText(PROJECT_MODAL_ROW.conflictMessage)).toBeTruthy();
    submitModal();
    expect(completions).toHaveLength(0);
  });
});
