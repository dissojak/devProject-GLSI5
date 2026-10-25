import type { AuthPageId, AuthPagePromptSet, NavLink } from "@/types/navigation";

export const NAV_LINKS: NavLink[] = [
  { id: "features", label: "Features", href: "#features" },
  { id: "how-it-works", label: "How it works", href: "#how-it-works" },
  { id: "docs", label: "Docs", href: "#docs" },
];

export const SESSION_ROUTE: NavLink = {
  id: "session",
  label: "Session",
  href: "/session",
};

export const AUTH_PAGE_PROMPTS: Record<AuthPageId, AuthPagePromptSet> = {
  login: {
    id: "login",
    headerPrompt: "New here?",
    headerCta: { id: "signup", label: "Sign up", href: "/signup" },
    cardPrompt: "Don't have an account?",
    cardCta: { id: "signup", label: "Sign up", href: "/signup" },
  },
  signup: {
    id: "signup",
    headerPrompt: "Already have an account?",
    headerCta: { id: "login", label: "Log in", href: "/" },
    cardPrompt: "Already have an account?",
    cardCta: { id: "login", label: "Log in", href: "/" },
  },
};
