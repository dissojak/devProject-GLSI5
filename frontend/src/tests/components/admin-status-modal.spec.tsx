// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { AdminStatusModal } from "@/components/admin/admin-status-modal";
import { ADMIN_STATUS_MODAL_ROWS } from "@/data/admin";
import type { AdminStatusModalMode, AdminUser } from "@/types/admin";
import { stubMotionEnvironment } from "@/tests/motion-stubs";

const ACTIVE: AdminUser = {
  id: "u2",
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "DEVELOPER",
  status: "ACTIVE",
  isActive: true,
  lastLoginAt: null,
  createdAt: "2025-06-01T08:00:00.000Z",
};

const DISABLED: AdminUser = {
  ...ACTIVE,
  id: "u3",
  status: "DISABLED",
};

beforeAll(() => {
  stubMotionEnvironment();
});

afterEach(cleanup);

type ModalProps = Parameters<typeof AdminStatusModal>[0];

function renderModal(
  mode: AdminStatusModalMode | null,
  user: AdminUser | null,
  overrides: Partial<ModalProps> = {},
) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  const view = render(
    <AdminStatusModal
      mode={mode}
      user={user}
      saving={false}
      onClose={onClose}
      onConfirm={onConfirm}
      {...overrides}
    />,
  );
  return { onClose, onConfirm, ...view };
}

describe("admin status modal — deactivate", () => {
  const row = ADMIN_STATUS_MODAL_ROWS.deactivate;

  it("renders the deactivate dialog naming the target", () => {
    renderModal("deactivate", ACTIVE);
    const dialog = screen.getByRole("dialog", { name: `${row.titleVerb} Ada Lovelace?` });
    expect(dialog).toBeTruthy();
    expect(screen.getByText(row.copy)).toBeTruthy();
    expect(screen.getByText(row.actionCode)).toBeTruthy();
    expect(screen.getByRole("button", { name: row.confirmLabel })).toBeTruthy();
    expect(screen.getByRole("button", { name: row.cancelLabel })).toBeTruthy();
    expect(screen.getByText("ada@example.com")).toBeTruthy();
  });

  it("confirms deactivation through the onConfirm seam and stays open", () => {
    const { onConfirm, onClose } = renderModal("deactivate", ACTIVE);
    fireEvent.click(screen.getByRole("button", { name: row.confirmLabel }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps actions reachable while not saving and blocks Escape when saving", () => {
    const { onClose } = renderModal("deactivate", ACTIVE, { saving: true });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("admin status modal — reactivate", () => {
  const row = ADMIN_STATUS_MODAL_ROWS.reactivate;

  it("renders the reactivate dialog for a disabled account", () => {
    renderModal("reactivate", DISABLED);
    expect(screen.getByRole("dialog", { name: `${row.titleVerb} Ada Lovelace?` })).toBeTruthy();
    expect(screen.getByText(row.copy)).toBeTruthy();
    expect(screen.getByRole("button", { name: row.confirmLabel })).toBeTruthy();
  });

  it("confirms reactivation through the onConfirm seam", () => {
    const { onConfirm } = renderModal("reactivate", DISABLED);
    fireEvent.click(screen.getByRole("button", { name: row.confirmLabel }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

describe("admin status modal — closed", () => {
  it("renders nothing without a mode or a user", () => {
    renderModal(null, ACTIVE);
    expect(screen.queryByRole("dialog")).toBeNull();
    cleanup();
    renderModal("deactivate", null);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes through cancel and Escape seams", () => {
    const { onClose } = renderModal("deactivate", ACTIVE);
    fireEvent.click(screen.getByRole("button", { name: ADMIN_STATUS_MODAL_ROWS.deactivate.cancelLabel }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
