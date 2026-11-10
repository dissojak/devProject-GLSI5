import type { Metadata } from "next";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopNav } from "@/components/dashboard/top-nav";
import { PlansBoard } from "@/components/pipeline/plans-board";
import { PLANS_ROUTE } from "@/data/dashboard";

export const metadata: Metadata = {
  title: "Plans",
};

export default function Plans() {
  return (
    <div className="bg-surface-low font-display text-body-md text-haze antialiased">
      <DashboardSidebar />
      <div className="pl-[260px]">
        <DashboardTopNav crumbLabel={PLANS_ROUTE.label} />
        <main className="min-h-screen w-full bg-surface-low pt-[72px]">
          <div className="mx-auto w-full max-w-6xl px-8 py-10">
            <PlansBoard />
          </div>
        </main>
      </div>
    </div>
  );
}
