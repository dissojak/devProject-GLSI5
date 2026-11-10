// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { AdminUsersContent } from "@/components/admin/admin-users-content";
import { ADMIN_SHOW_DEACTIVATED_LABEL, ADMIN_USERS_EMPTY_ROW } from "@/data/admin";
import type { AdminUser } from "@/types/admin";
import { stubMotionEnvironment } from "@/tests/motion-stubs";

const USER: AdminUser = {
  id: "u1",
  name: "DissoJak",
  email: "dissojak@gmail.com",
  role: "DEVELOPER",
  status: "ACTIVE",
  isActive: true,
  lastLoginAt: "2026-11-09T19:50:00.000Z",
  createdAt: "2026-10-25T09:00:00.000Z",
};

function baseProps() {
  return {
    users: [] as AdminUser[],
    loading: false,
    error: false,
    onRetry: vi.fn(),
    query: "",
    onQuery: vi.fn(),
    roleFilter: "",
    onRoleFilter: vi.fn(),
    includeDeleted: false,
    onIncludeDeleted: vi.fn(),
    pagination: { page: 1, limit: 20, total: 2, pageCount: 1 },
    page: 1,
    onPage: vi.fn(),
    selfId: "u9",
    menuUserId: null as string | null,
    onMenuUserChange: vi.fn(),
    onMenuAction: vi.fn(),
  };
}

type Props = Parameters<typeof AdminUsersContent>[0];

beforeAll(() => {
  stubMotionEnvironment();
});

afterEach(cleanup);

describe("admin users toolbar", () => {
  it("toggles the deactivated switch between off and on", () => {
    const props = baseProps();
    const view = render(<AdminUsersContent {...props} />);
    const switchButton = screen.getByRole("switch", { name: ADMIN_SHOW_DEACTIVATED_LABEL });
    expect(switchButton.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(switchButton);
    expect(props.onIncludeDeleted).toHaveBeenCalledWith(true);

    view.rerender(<AdminUsersContent {...(props as Props)} includeDeleted={true} />);
    expect(
      screen.getByRole("switch", { name: ADMIN_SHOW_DEACTIVATED_LABEL }).getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("slides the thumb to the on position; a fresh off-render starts at the left", () => {
    const props = baseProps();
    const on = render(<AdminUsersContent {...props} includeDeleted={true} />);
    const onThumb = on.container.querySelector('[role="switch"] span span') as HTMLElement;
    expect(onThumb.style.transform).toContain("20px");
    cleanup();
    const off = render(<AdminUsersContent {...props} includeDeleted={false} />);
    const offThumb = off.container.querySelector('[role="switch"] span span') as HTMLElement;
    expect(offThumb.style.transform).not.toContain("20px");
  });

  it("pipes the role filter selection upstream", () => {
    const props = baseProps();
    render(<AdminUsersContent {...props} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "DEVELOPER" } });
    expect(props.onRoleFilter).toHaveBeenCalledWith("DEVELOPER");
  });

  it("navigates pagination through upstream callbacks only", () => {
    const props = baseProps();
    props.pagination = { page: 2, limit: 20, total: 3, pageCount: 2 };
    props.users = [USER, { ...USER, id: "u2", name: "Stoon" }];
    render(<AdminUsersContent {...props} page={2} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(props.onPage).toHaveBeenCalledOnce();
    expect(props.onPage).toHaveBeenCalledWith(1);

    const next = screen.getByRole("button", { name: "Next page" }) as HTMLButtonElement;
    expect(next.disabled).toBe(true); // clamped on the last page
  });

  it("shows the empty roster state when no users match", () => {
    const props = baseProps();
    render(<AdminUsersContent {...props} />);
    expect(screen.getByText(ADMIN_USERS_EMPTY_ROW.copy)).toBeTruthy();
    expect(screen.getByText("0 users")).toBeTruthy();
  });

  it("renders the users table with the current page rows", () => {
    const props = baseProps();
    props.users = [USER];
    render(<AdminUsersContent {...props} />);
    expect(screen.getByText("DissoJak")).toBeTruthy();
    expect(screen.getByText("dissojak@gmail.com")).toBeTruthy();
  });
});
