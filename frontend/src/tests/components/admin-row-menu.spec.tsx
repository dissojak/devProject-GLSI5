// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { AdminRowMenu } from "@/components/admin/admin-row-menu";
import { ADMIN_USERS_MENU_ROWS } from "@/data/admin";
import type { AdminUser } from "@/types/admin";
import { adminMenuActionOrder } from "@/utils/admin-actions";
import { stubMotionEnvironment } from "@/tests/motion-stubs";

const ACTIVE_ADMIN: AdminUser = {
  id: "u1",
  name: "Sarah Hamza",
  email: "sarah@example.com",
  role: "ADMIN",
  status: "ACTIVE",
  isActive: true,
  lastLoginAt: "2026-11-08T18:24:00.000Z",
  createdAt: "2025-06-01T08:00:00.000Z",
};

const OTHER: AdminUser = {
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
  ...OTHER,
  id: "u3",
  status: "DISABLED",
};

type MenuProps = Parameters<typeof AdminRowMenu>[0];

function rect(top: number, bottom: number): DOMRect {
  return { top, bottom, height: bottom - top, left: 1100, right: 1132, width: 32 } as DOMRect;
}

/** Pins the trigger geometry: `getBoundingClientRect` backing the placement math. */
function placeTrigger(top: number, bottom: number) {
  return vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockReturnValue(rect(top, bottom));
}

beforeAll(() => {
  stubMotionEnvironment();
});

afterEach(cleanup);

afterEach(() => {
  vi.restoreAllMocks();
});

function renderOpen(props: Omit<MenuProps, "open" | "onOpenChange" | "onAction">, placement?: [number, number]) {
  const onOpenChange = vi.fn();
  const onAction = vi.fn();
  const base = (
    <AdminRowMenu {...props} open={false} onOpenChange={onOpenChange} onAction={onAction} />
  );
  const view = render(base);
  if (placement) {
    placeTrigger(placement[0], placement[1]);
  }
  fireEvent.click(screen.getByRole("button", { name: "Open user actions" }));
  view.rerender(<AdminRowMenu {...props} open={true} onOpenChange={onOpenChange} onAction={onAction} />);
  return { onOpenChange, onAction, view };
}

describe("admin row menu", () => {
  it("renders the panel as a fixed-position portal, placed under the trigger", () => {
    renderOpen({ user: OTHER, selfId: "u1" }, [80, 100]);
    const panel = screen.getByRole("menu");
    expect(panel.style.position).toBe("fixed");
    expect(panel.style.top).toBe("106px"); // trigger bottom + 6px gap
    expect(panel.style.bottom).toBe("");
    expect(panel.parentNode).toBe(document.body);
  });

  it("flips above the trigger when a clip boundary sits too close below", () => {
    renderOpen({ user: OTHER, selfId: "u1" }, [700, 720]);
    const panel = screen.getByRole("menu");
    expect(panel.style.bottom).toBe("74px"); // 768 viewport − (trigger top 700 − 6px gap)
    expect(panel.style.top).toBe("");
  });

  it("lists edit, role and deactivate for an active stranger", () => {
    renderOpen({ user: OTHER, selfId: "u1" }, [80, 100]);
    const menu = screen.getByRole("menu");
    expect(menu).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Edit user" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Change role" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Deactivate" })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: "Reactivate" })).toBeNull();
  });

  it("reorders to show Reactivate instead of Deactivate for a disabled account", () => {
    renderOpen({ user: DISABLED, selfId: "u1" }, [80, 100]);
    expect(screen.getByRole("menuitem", { name: "Reactivate" })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: "Deactivate" })).toBeNull();
  });

  it("renders exactly the actions its status orders", () => {
    renderOpen({ user: OTHER, selfId: "u1" }, [80, 100]);
    const labels = adminMenuActionOrder(OTHER.status).map(
      (action) => ADMIN_USERS_MENU_ROWS.find((row) => row.id === action)?.label ?? "",
    );
    for (const label of labels) {
      expect(screen.getByRole("menuitem", { name: label })).toBeTruthy();
    }
  });

  it("blocks role changes on self and explains why", () => {
    renderOpen({ user: ACTIVE_ADMIN, selfId: "u1" }, [80, 100]);
    const roleItem = screen.getByRole("menuitem", { name: "Change role" });
    expect(roleItem.getAttribute("aria-disabled")).toBe("true");
    expect(roleItem.getAttribute("title")).toContain("own role");
  });

  it("blocks deactivation on self but still allows edit and role", () => {
    renderOpen({ user: ACTIVE_ADMIN, selfId: "u1" }, [80, 100]);
    expect(
      screen.getByRole("menuitem", { name: "Deactivate" }).getAttribute("aria-disabled"),
    ).toBe("true");
    expect(screen.getByRole("menuitem", { name: "Edit user" }).getAttribute("aria-disabled")).toBeNull();
    expect(screen.getByRole("menuitem", { name: "Change role" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
  });

  it("dispatches the chosen action and nothing else for enabled rows", () => {
    const { onAction } = renderOpen({ user: OTHER, selfId: "u1" }, [80, 100]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Deactivate" }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith("deactivate", OTHER);
  });

  it("swallows clicks on disabled rows without dispatching", () => {
    const { onAction } = renderOpen({ user: ACTIVE_ADMIN, selfId: "u1" }, [80, 100]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Change role" }));
    expect(onAction).not.toHaveBeenCalled();
  });

  it("closes on outside mousedown", () => {
    const { onOpenChange } = renderOpen({ user: OTHER, selfId: "u1" }, [80, 100]);
    onOpenChange.mockClear();
    fireEvent.mouseDown(document.body);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes on Escape", () => {
    const { onOpenChange } = renderOpen({ user: OTHER, selfId: "u1" }, [80, 100]);
    onOpenChange.mockClear();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps mousedown inside the panel from closing it", () => {
    const { onOpenChange } = renderOpen({ user: OTHER, selfId: "u1" }, [80, 100]);
    onOpenChange.mockClear();
    fireEvent.mouseDown(screen.getByRole("menu"));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("closes when the page scrolls so the fixed panel never drifts", () => {
    const { onOpenChange } = renderOpen({ user: OTHER, selfId: "u1" }, [80, 100]);
    onOpenChange.mockClear();
    fireEvent.scroll(window);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders nothing while closed", () => {
    const onOpenChange = vi.fn();
    const onAction = vi.fn();
    render(
      <AdminRowMenu
        user={OTHER}
        selfId="u1"
        open={false}
        onOpenChange={onOpenChange}
        onAction={onAction}
      />,
    );
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
