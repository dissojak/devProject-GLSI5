import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopNav } from "@/components/dashboard/top-nav";
import { AdminSidebarSection } from "@/components/admin/admin-sidebar-section";
import { AdminPage } from "@/components/admin/admin-page";

export const metadata = {
  title: "Administration",
};

export default function Admin() {
  return (
    <div className="bg-surface-low font-display text-body-md text-haze antialiased">
      <DashboardSidebar extras={<AdminSidebarSection />} />
      <div className="pl-[260px]">
        <DashboardTopNav crumbLabel="Administration" />
        <main className="min-h-screen w-full bg-surface-low pt-[72px]">
          <AdminPage />
        </main>
      </div>
    </div>
  );
}
