import type { Metadata } from "next";
import { Suspense } from "react";
import { GithubConnected } from "@/components/auth/github-connected";

export const metadata: Metadata = {
  title: "GitHub connected",
};

export default function GithubConnectedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-low px-6">
      <Suspense fallback={null}>
        <GithubConnected />
      </Suspense>
    </main>
  );
}
