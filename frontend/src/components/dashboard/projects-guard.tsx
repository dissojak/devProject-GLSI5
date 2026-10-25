"use client";

import type { ReactNode } from "react";
import { AUTH_LOGIN_ROUTE } from "@/data/navigation";
import { useAuthGate } from "@/hooks/use-session-guard";

export function ProjectsGuard({ children }: { children: ReactNode }) {
  const status = useAuthGate(AUTH_LOGIN_ROUTE.href);
  if (status !== "granted") {
    return null;
  }
  return <>{children}</>;
}
