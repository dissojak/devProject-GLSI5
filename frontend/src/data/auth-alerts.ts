import type { AuthAlertBanner, LoginAlertKind } from "@/types/auth";

/**
 * Alert banners for auth form failures (mockup contract). Extend HERE by
 * adding a row, never by editing the banner renderer mid-tree.
 */
export const AUTH_ALERTS: Record<LoginAlertKind, AuthAlertBanner> = {
  "invalid-credentials": {
    id: "invalid-credentials",
    tone: "crimson",
    icon: "error",
    message: "Invalid email or password.",
  },
  "account-deactivated": {
    id: "account-deactivated",
    tone: "orange",
    icon: "person_off",
    message: "Your account has been deactivated. Contact an administrator.",
  },
  "pending-approval": {
    id: "pending-approval",
    tone: "champagne",
    icon: "schedule",
    message: "Your account is awaiting administrator approval, or has been disabled.",
  },
  unexpected: {
    id: "unexpected",
    tone: "crimson",
    icon: "error",
    message: "Something went wrong. Please try again.",
  },
};
