// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { AdminChangeRoleModal } from "@/components/admin/admin-change-role-modal";
import { ADMIN_ROLE_MODAL_ROW, ADMIN_ROLE_OPTIONS } from "@/data/admin";
import type { AdminUser } from "@/types/admin";
import { stubMotionEnvironment } from "@/tests/motion-stubs";

const DEVELOPER: AdminUser = {
  id: "u2",
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "DEVELOPER",
  status: "ACTIVE",
  isActive: true,
  lastLoginAt: null,
  createdAt: "2025-06-01T08:00:00.000Z",
};

const ADMIN: AdminUser = {
  ...DEVELOPER,
  id: "u1",
  name: "Sarah Hamza",
  role: "ADMIN",
};

beforeAll(() => {
  stubMotionEnvironment();
});

afterEach(cleanup);

function renderModal(
  user: AdminUser = DEVELOPER,
  overrides: Partial<Parameters<typeof AdminChangeRoleModal>[0]> = {},
) {
  const onClose = vi.fn();
  const onSubmit = vi.fn();
  const onDismissError = vi.fn();
  const view = render(
    <AdminChangeRoleModal
      user={user}
      saving={false}
      error={null}
      onDismissError={onDismissError}
      onClose={onClose}
      onSubmit={onSubmit}
      {...overrides}
    />,
  );
  return { onClose, onSubmit, onDismissError, ...view };
}

describe("admin change role modal", () => {
  it("renders the dialog labeled for the target user with both role options", () => {
    renderModal();
    const dialog = screen.getByRole("dialog", { name: ADMIN_ROLE_MODAL_ROW.title });
    expect(dialog).toBeTruthy();
    expect(screen.getByText("Ada Lovelace (ada@example.com)")).toBeTruthy();
    expect(screen.getByRole("radio", { name: new RegExp(ADMIN_ROLE_OPTIONS[0].title) })).toBeTruthy();
    expect(screen.getByRole("radio", { name: new RegExp(ADMIN_ROLE_OPTIONS[1].title) })).toBeTruthy();
    expect(screen.getByRole("button", { name: ADMIN_ROLE_MODAL_ROW.submitLabel })).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: ADMIN_ROLE_MODAL_ROW.cancelLabel }).length,
    ).toBe(2);
  });

  it("pre-selects the user's current role and disables submitting it again", () => {
    renderModal(ADMIN);
    const adminRadio = screen.getByRole("radio", { name: new RegExp("Administrator") });
    expect(adminRadio.getAttribute("aria-checked")).toBe("true");
    const submit = screen.getByRole("button", { name: ADMIN_ROLE_MODAL_ROW.submitLabel });
    expect(submit.hasAttribute("disabled")).toBe(true);
  });

  it("submits the newly selected role through the onSubmit seam", () => {
    const { onSubmit, onClose } = renderModal(DEVELOPER);
    fireEvent.click(screen.getByRole("radio", { name: new RegExp("Administrator") }));
    const submit = screen.getByRole("button", { name: ADMIN_ROLE_MODAL_ROW.submitLabel });
    expect(submit.hasAttribute("disabled")).toBe(false);
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith("ADMIN");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps the submit disabled while saving", () => {
    renderModal(DEVELOPER, { saving: true });
    fireEvent.click(screen.getByRole("radio", { name: new RegExp("Administrator") }));
    expect(
      screen.getByRole("button", { name: ADMIN_ROLE_MODAL_ROW.submitLabel }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("shows the backend error banner with its dismiss seam", () => {
    const { onDismissError } = renderModal(DEVELOPER, { error: "User already has this role" });
    expect(screen.getByText(ADMIN_ROLE_MODAL_ROW.errorHeading)).toBeTruthy();
    expect(screen.getByText("User already has this role")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: ADMIN_ROLE_MODAL_ROW.errorCloseLabel }));
    expect(onDismissError).toHaveBeenCalledOnce();
  });

  it("closes through the header and footer cancel seams", () => {
    const { onClose } = renderModal();
    const cancelButtons = screen.getAllByRole("button", { name: ADMIN_ROLE_MODAL_ROW.cancelLabel });
    expect(cancelButtons).toHaveLength(2);
    fireEvent.click(cancelButtons[0]);
    fireEvent.click(cancelButtons[1]);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("closes on Escape when not saving", () => {
    const { onClose } = renderModal();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("doesn't close on Escape while saving", () => {
    const { onClose } = renderModal(DEVELOPER, { saving: true });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});
