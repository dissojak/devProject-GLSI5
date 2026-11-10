import type { AdminUser, AdminMenuActionId } from "@/types/admin";

export interface AdminMenuStates {
  edit: boolean;
  role: boolean;
  deactivate: boolean;
  reactivate: boolean;
}

/**
 * Per-row permission map for the user row menu (mirrors backend rules:
 * PATCH /users/:id, POST /users/:id/deactivate|reactivate).
 * `true` = the action is blocked for this row.
 */
export function adminMenuStates(user: AdminUser, selfId: string): AdminMenuStates {
  const isSelf = user.id === selfId;
  return {
    edit: false,
    role: isSelf,
    deactivate: isSelf || user.status !== "ACTIVE",
    reactivate: user.status !== "DISABLED",
  };
}

export function adminMenuActionOrder(status: AdminUser["status"]): AdminMenuActionId[] {
  if (status === "DISABLED") {
    return ["edit", "role", "reactivate"];
  }
  return ["edit", "role", "deactivate"];
}
