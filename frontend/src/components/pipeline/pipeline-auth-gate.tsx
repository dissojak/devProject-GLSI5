"use client";

import type { ReactNode } from "react";
import { PipelineSkeleton } from "@/components/pipeline/pipeline-skeleton";
import { AUTH_LOGIN_ROUTE } from "@/data/navigation";
import { useAuthGate } from "@/hooks/use-session-guard";

export function PipelineAuthGate({ children }: { children: ReactNode }) {
  const gate = useAuthGate(AUTH_LOGIN_ROUTE.href);
  return gate === "granted" ? children : <PipelineSkeleton />;
}
