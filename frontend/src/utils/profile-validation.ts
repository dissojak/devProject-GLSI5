import { PASSWORD_MAX_LENGTH } from "@/utils/validators";

/** Mockup-critical edit contract for the identity panel. */
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const AVATAR_MAX_LENGTH = 2048;

/**
 * Field-level validators mirror the backend zod contracts (name 2–100,
 * avatar https URL ≤ 2048) so identical inputs fail identically on both
 * sides before any request leaves the panel.
 */
export function validateProfileName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < NAME_MIN_LENGTH) {
    return "Name must be at least 2 characters.";
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `Name must be at most ${NAME_MAX_LENGTH} characters.`;
  }
  return null;
}

export function validateAvatarUrl(value: string): string | null {
  if (value.length > AVATAR_MAX_LENGTH) {
    return "Avatar URL is too long.";
  }
  if (!value) {
    return null;
  }
  let parsed: URL | null = null;
  try {
    parsed = new URL(value);
  } catch {
    parsed = null;
  }
  if (!parsed || parsed.protocol !== "https:") {
    return "Avatar must be a valid https URL.";
  }
  return null;
}

export interface PasswordCriterionRow {
  id: string;
  label: string;
  met: boolean;
}

/** The four mockup checks displayed under the new-password field. */
export function passwordCriterionRows(value: string): PasswordCriterionRow[] {
  return [
    {
      id: "length",
      label: "Minimum 8 characters",
      met: value.length >= 8 && value.length <= PASSWORD_MAX_LENGTH,
    },
    { id: "case", label: "1+ uppercase letter", met: /[A-Z]/.test(value) },
    { id: "digit", label: "1+ numerical digit", met: /\d/.test(value) },
    {
      id: "special",
      label: "1+ special symbol",
      met: /[^A-Za-z0-9]/.test(value),
    },
  ];
}

/**
 * Inline new-password error copy, mirroring the backend schema order:
 * length bounds first, then the reuse restriction (mockup states B & C).
 */
export function validateNewPassword(value: string, current: string): string | null {
  if (value.length === 0) {
    return null;
  }
  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  if (value === current) {
    return "New password must be different from your current password.";
  }
  return null;
}

export function validatePasswordMatch(value: string, confirm: string): string | null {
  if (confirm.length === 0 || value === confirm) {
    return null;
  }
  return "Passwords do not match.";
}

const STRENGTH_LABELS = ["Weak", "Weak", "Fair", "Strong", "Strong"] as const;

/** Human label for the criteria meter: 0–1 weak, 2 fair, 3–4 strong (per mockup). */
export function passwordStrengthLabel(metCount: number): string {
  return STRENGTH_LABELS[Math.min(Math.max(metCount, 0), STRENGTH_LABELS.length - 1)];
}

export function profileEditIsDirty(
  baseline: { name: string; avatarUrl: string },
  values: { name: string; avatarUrl: string },
): boolean {
  return (
    values.name !== baseline.name ||
    values.avatarUrl.trim() !== baseline.avatarUrl.trim()
  );
}
