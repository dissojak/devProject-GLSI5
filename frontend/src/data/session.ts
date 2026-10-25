import type { NavLink } from "@/types/navigation";

export interface SessionSummaryField {
  id: "name" | "email" | "role";
  label: string;
}

export const SESSION_SUMMARY_FIELDS: SessionSummaryField[] = [
  { id: "name", label: "Name" },
  { id: "email", label: "Email" },
  { id: "role", label: "Role" },
];

export const SESSION_SUMMARY = {
  id: "session-summary",
  heading: "You are signed in",
  tokenLabel: "Access token",
} as const;

export const SESSION_BACK_LINK: NavLink = {
  id: "session-back-link",
  label: "Back to login",
  href: "/",
};

export const SESSION_LOGOUT_CTA = {
  id: "session-logout-cta",
  label: "Log out",
} as const;
