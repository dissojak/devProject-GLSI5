import type { Metadata } from "next";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopNav } from "@/components/dashboard/top-nav";
import { ProfilePage } from "@/components/profile/profile-page";

export const metadata: Metadata = {
  title: "Profile",
};

export default function Profile() {
  return (
    <div className="bg-surface-low font-display text-body-md text-haze antialiased">
      <DashboardSidebar />
      <div className="pl-[260px]">
        <DashboardTopNav crumbLabel="Profile" />
        <main className="min-h-screen w-full bg-surface-low pt-[72px]">
          <ProfilePage />
        </main>
      </div>
    </div>
  );
}
