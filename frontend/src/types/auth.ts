import type { MaterialIconName } from "@/types/icons";

export interface AuthAccount {
  id: string;
  name: string;
  email: string;
  role: string;
}

export type AuthGateStatus = "pending" | "granted" | "denied";

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

/** Backend error codes surfaced by the auth endpoints (error-status-table.ts). */
export type AuthErrorCode =
  | "UNAUTHORIZED"
  | "ACCOUNT_DISABLED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | (string & Record<never, never>);

export type AuthAlertTone = "crimson" | "orange" | "champagne";

export type LoginAlertKind =
  | "invalid-credentials"
  | "account-deactivated"
  | "pending-approval"
  | "github-conflict"
  | "unexpected";

export interface AuthAlertBanner {
  id: LoginAlertKind;
  tone: AuthAlertTone;
  icon: MaterialIconName;
  message: string;
}

/** Raw HTTP outcome of one auth request; components map it to UI states. */
export type AuthApiResult =
  | { kind: "http"; httpOk: boolean; status: number; payload: unknown }
  | { kind: "network" };

export interface SignupSubmission {
  name: string;
  email: string;
  password: string;
}

export type LoginSubmitOutcome =
  | { kind: "approved"; user: AuthAccount; accessToken: string }
  | { kind: "failed"; alert: LoginAlertKind; code: string; message: string };

export type SignupSubmitOutcome =
  | { kind: "created"; user: AuthAccount }
  | {
      kind: "failed";
      code: string;
      message: string;
      fieldErrors: SignupFieldErrors;
    };

export interface LoginFormValues {
  email: string;
  password: string;
}

export type LoginFieldKey = keyof LoginFormValues;

export type LoginFieldError = string | null;

export type LoginFieldErrors = Partial<Record<LoginFieldKey, LoginFieldError>>;

export interface SignupFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type SignupFieldKey = keyof SignupFormValues;

export type SignupFieldErrors = Partial<Record<SignupFieldKey, LoginFieldError>>;
