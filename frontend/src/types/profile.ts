/**
 * Self-scoped account profile (backend `/profile` domain). Read and update
 * return the full DTO; the password change returns `data: null` and therefore
 * manages no cache tags of its own.
 */
export interface ProfileAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  lastLoginAt: string | null;
}

export interface ProfileResponse {
  message: string;
  data: ProfileAccount;
}

export interface ProfileUpdateBody {
  name: string;
  avatarUrl: string | null;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}
