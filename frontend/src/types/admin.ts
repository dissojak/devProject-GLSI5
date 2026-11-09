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
}

export interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
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
