"use client";

import { useAuthSession } from "@/hooks/use-auth-session";
import { useAuthGate } from "@/hooks/use-session-guard";
import { AUTH_LOGIN_ROUTE } from "@/data/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const status = useAuthGate(AUTH_LOGIN_ROUTE.href);
  const { user } = useAuthSession();
  const router = useRouter();
  const isAdmin = (user?.role ?? "").trim().toUpperCase() === "ADMIN";

  useEffect(() => {
    if (status === "granted" && !isAdmin) {
      const id = window.setTimeout(() => router.replace("/projects"), 0);
      return () => window.clearTimeout(id);
    }
  }, [status, isAdmin, router]);

  if (status !== "granted") return null;
  if (!isAdmin) return null;
  return <>{children}</>;
}
