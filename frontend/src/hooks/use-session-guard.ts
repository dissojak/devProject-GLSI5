import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AuthGateStatus } from "@/types/auth";
import { useAuthSession } from "@/hooks/use-auth-session";

export function useAuthGate(redirectTo: string): AuthGateStatus {
  const { token, hydrated } = useAuthSession();
  const router = useRouter();
  const status: AuthGateStatus = !hydrated ? "pending" : token ? "granted" : "denied";

  useEffect(() => {
    if (status === "denied") {
      router.replace(redirectTo);
    }
  }, [status, redirectTo, router]);

  return status;
}
