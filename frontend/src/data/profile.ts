import type { MaterialIconName } from "@/types/icons";

export const PROFILE_PAGE_HEADER_ROW = {
  crumbLabel: "Profile",
  kicker: "Operator configuration",
  title: "Profile",
  subtitle: "Manage your personal information and account security.",
} as const;

export const PROFILE_PANEL_ROW = {
  label: "Profile",
  metaLabel: "SEC-NODE // 0x489F",
} as const;

export const PROFILE_FIELD_ROWS = {
  nameLabel: "Full Name",
  nameHint: "2 to 100 characters",
  emailLabel: "Email Address",
  emailHint: "Email can't be changed.",
  avatarLabel: "Avatar URL",
  avatarPlaceholder: "https://example.com/avatar.png",
  avatarHint: "Use an https image link. Leave empty to remove your avatar.",
  removeAvatar: "Remove avatar",
} as const;

export const PROFILE_ROLE_ROW = {
  label: "Account Role",
  note: "Role is managed by administrators.",
} as const;

export const PROFILE_SAVE_ACTIONS_ROW = {
  cancel: "Cancel",
  save: "Save changes",
  saving: "Saving...",
} as const;

/** Footer status copy, one row per editing state (mockup save-state matrix). */
export type ProfileSaveHintId = "dirty" | "invalid" | "ready" | "saving" | "saved";

interface ProfileSaveHint {
  chip: string;
  icon: MaterialIconName;
  copy: string;
  tone: "champagne" | "crimson" | "mint";
}

export const PROFILE_SAVE_HINT_ROW: Record<ProfileSaveHintId, ProfileSaveHint> = {
  dirty: {
    chip: "Dirty buffer",
    icon: "priority_high",
    copy: "Unsaved parameter delta",
    tone: "champagne",
  },
  invalid: {
    chip: "Schema rejected",
    icon: "error",
    copy: "Form invalid: resolve payload errors",
    tone: "crimson",
  },
  ready: {
    chip: "CDN resolved",
    icon: "check_circle",
    copy: "Asset validated. Ready for manifest deployment.",
    tone: "mint",
  },
  saving: {
    chip: "Writing raft log",
    icon: "progress_activity",
    copy: "Replicating mutations across the identity cluster...",
    tone: "champagne",
  },
  saved: {
    chip: "Sync complete",
    icon: "verified",
    copy: "All changes saved",
    tone: "mint",
  },
};

export const PROFILE_SAVE_ERROR_ROW = {
  title: "Save failed",
} as const;

export const PROFILE_UPDATED_TOAST_ROW = {
  title: "Profile updated",
  message: "Your changes have been safely committed.",
} as const;

export const COMPACT_HERO_ROW = {
  editDetails: "Edit details",
  editIcon: "unfold_more" as MaterialIconName,
} as const;

export const SECURITY_PANEL_ROW = {
  label: "Security",
  metaLabel: "MFA // ACTIVE",
  passwordTitle: "Password",
  passwordSubtitle: "Change your password to keep your account secure.",
  changeAction: "Change password",
  changeIcon: "key" as MaterialIconName,
  rowIcon: "lock_reset" as MaterialIconName,
} as const;

export const PASSWORD_FORM_ROWS = {
  title: "Change password",
  subtitle: "Enter your current password and choose a strong new password.",
  errorTitle: "Authentication failed",
  currentLabel: "Current password",
  forgotHint: "Forgot password?",
  forgotHref: "/login",
  newLabel: "New password",
  meterLabel: "Entropy strength",
  newHint: "8 to 128 characters. Must be different from your current password.",
  confirmLabel: "Confirm new password",
  confirmHint: "Re-enter your new password to verify.",
  matchedLabel: "Passwords match",
  update: "Update password",
  updating: "Updating...",
  updateError: "Update failed",
} as const;

export const PASSWORD_SESSION_POLICY_ROW = {
  title: "Session invalidation policy",
  copy: "You'll stay signed in on this device. Other active sessions will be terminated automatically.",
} as const;

export const PASSWORD_STRENGTH_ROWS = {
  weak: "Weak",
  fair: "Fair",
  strong: "Strong",
  metSuffix: "of 4 met",
} as const;

export const PASSWORD_UPDATED_TOAST_ROW = {
  title: "Password updated",
  message: "Your password was changed successfully.",
} as const;

export const PROFILE_ERROR_ROWS = {
  chip: "Profile sync failed",
  title: "We couldn't load your profile",
  copy: "Something went wrong while connecting. Please verify your connection or try again.",
  retry: "Try again",
  back: "Return to projects",
} as const;

export const PROFILE_SKELETON_ROW = {
  liveChip: "Fetching profile & security // async hydration",
} as const;
