import type { MaterialIconName } from "@/types/icons";

export type AccountStatus = "PENDING" | "ACTIVE" | "REJECTED" | "DISABLED";

export type UserRole = "DEVELOPER" | "ADMIN";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
}

export interface AdminUserListResponse {
  message?: string;
  data: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
}

export interface AdminPendingResponse {
  message?: string;
  data: PendingUser[];
}

export interface AdminUserResponse {
  message?: string;
  data: AdminUser;
}

export type AdminTabId = "pending" | "users";

export type AdminMenuActionId = "edit" | "role" | "deactivate" | "reactivate";

export interface AdminMenuRow {
  id: AdminMenuActionId;
  label: string;
  icon: MaterialIconName;
  tone: "ice" | "crimson" | "mint";
  dividerBefore?: boolean;
}

export interface AdminStatusPillRow {
  label: string;
  tone: string;
  dot: string;
}

export interface AdminRolePillRow {
  label: string;
  icon: MaterialIconName;
  tone: string;
}

export interface AdminRoleOptionRow {
  id: UserRole;
  icon: MaterialIconName;
  title: string;
  currentChip: string;
  idleChip: string;
  tileClasses: string;
  description: string;
}

export type AdminStatusModalMode = "deactivate" | "reactivate";

export interface AdminStatusModalRow {
  kicker: string;
  titleVerb: string;
  icon: MaterialIconName;
  accentClasses: string;
  iconTileClasses: string;
  actionCode: string;
  copy: string;
  cancelLabel: string;
  confirmLabel: string;
  confirmIcon: MaterialIconName;
  confirmVariant: "crimson" | "mint";
}

export interface AdminGovernanceRow {
  id: string;
  icon: MaterialIconName;
  label: string;
  copy: string;
}
