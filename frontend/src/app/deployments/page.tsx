import type { Metadata } from "next";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopNav } from "@/components/dashboard/top-nav";
import { DeploymentsBoard } from "@/components/pipeline/deployments-board";
import { DEPLOYMENTS_ROUTE } from "@/data/dashboard";

export const metadata: Metadata = {
  title: "Deployments",
};

export default function Deployments() {
  return (
    <div className="bg-surface-low font-display text-body-md text-haze antialiased">
      <DashboardSidebar />
      <div className="pl-[260px]">
        <DashboardTopNav crumbLabel={DEPLOYMENTS_ROUTE.label} />
        <main className="min-h-screen w-full bg-surface-low pt-[72px]">
          <div className="mx-auto w-full max-w-6xl px-8 py-10">
            <DeploymentsBoard />
          </div>
        </main>
      </div>
    </div>
  );
}
