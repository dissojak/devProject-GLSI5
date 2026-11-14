"use client";

import Link from "next/link";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useMounted } from "@/hooks/use-mounted";
import { useListPendingUsersQuery } from "@/store/admin-api";
import { ADMIN_SIDEBAR_ROW } from "@/data/admin";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";

const SECTION_LABEL = "Administration";

/**
 * Static shell piece: NO query hooks here. Renders a leaf for the live
 * pending badge only when the signed-in user is an admin, so the RTKQ
 * hook is never touched during prerender (Cache Components guard).
 */
export function AdminSidebarSection() {
  const session = useAuthSession();
  const mounted = useMounted();
  const user = mounted ? session.user : null;
  const isAdmin = (user?.role ?? "").trim().toUpperCase() === "ADMIN";
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="mb-1 px-2 font-mono text-label-sm uppercase text-cinder">
        {SECTION_LABEL}
      </div>
      <nav aria-label={SECTION_LABEL} className="flex flex-col gap-1">
        <Link
          href={ADMIN_SIDEBAR_ROW.href}
          aria-current="page"
          className="flex items-center justify-between rounded-lg border-l-2 border-frost-mid bg-surface-mid px-4 py-2 font-medium text-frost-mid shadow-sm transition-colors"
        >
          <span className="flex items-center gap-2">
            <MaterialIcon name={ADMIN_SIDEBAR_ROW.icon} className="text-[20px] text-ice-dim" />
            <span className="font-display text-body-md">{ADMIN_SIDEBAR_ROW.label}</span>
          </span>
          <AdminPendingCountBadge />
        </Link>
      </nav>
    </div>
  );
}

function AdminPendingCountBadge() {
  const pendingQuery = useListPendingUsersQuery();
  const count = pendingQuery.data?.data.length ?? 0;
  if (count <= 0) {
    return null;
  }
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5",
        "bg-champagne font-mono text-[11px] font-bold text-navy",
      )}
    >
      {count}
    </span>
  );
}
