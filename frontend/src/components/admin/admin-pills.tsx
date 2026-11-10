import { ADMIN_ROLE_PILLS, ADMIN_STATUS_PILLS } from "@/data/admin";
import type { AccountStatus, UserRole } from "@/types/admin";
import { initials } from "@/utils/identity";
import { cn } from "@/utils/class-names";

const PILL_BASE =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-label-sm uppercase";

const STATUS_TONE_BORDERS: Record<AccountStatus, string> = {
  PENDING: "border-champagne/40",
  ACTIVE: "border-mint/40",
  REJECTED: "border-crimson/40",
  DISABLED: "border-orange/40",
};

const ROLE_TONE_BORDERS: Record<UserRole, string> = {
  DEVELOPER: "border-teal/40",
  ADMIN: "border-champagne/40",
};

export function AdminStatusPill({ status }: { status: AccountStatus }) {
  const row = ADMIN_STATUS_PILLS[status];
  return (
    <span className={cn(PILL_BASE, row.tone, STATUS_TONE_BORDERS[status])}>
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", row.dot)} />
      {row.label}
    </span>
  );
}

export function AdminRolePill({ role }: { role: UserRole }) {
  const row = ADMIN_ROLE_PILLS[role];
  return (
    <span
      className={cn(PILL_BASE, row.tone, ROLE_TONE_BORDERS[role])}
    >
      <span aria-hidden="true" className="material-symbols-outlined select-none text-[14px]">
        {row.icon}
      </span>
      {row.label}
    </span>
  );
}

export function AdminAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-surface-high font-display font-bold text-foam",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
