import type {
  AccountStatus,
  AdminGovernanceRow,
  AdminMenuRow,
  AdminRoleOptionRow,
  AdminRolePillRow,
  AdminStatusModalMode,
  AdminStatusModalRow,
  AdminStatusPillRow,
  AdminTabId,
  UserRole,
} from "@/types/admin";
import type { MaterialIconName } from "@/types/icons";

export const ADMIN_PAGE_HEADER_ROW = {
  crumbLabel: "Administration",
  kicker: "Access governance // System console",
  title: "Administration",
  subtitle: "Approve new accounts and manage platform users.",
} as const;

export const ADMIN_TABS: Array<{ id: AdminTabId; label: string }> = [
  { id: "pending", label: "Pending approvals" },
  { id: "users", label: "All users" },
];

export const ADMIN_SYNC_ROW = {
  label: "Realtime sync active",
} as const;

export const ADMIN_PENDING_STAT_ROW = {
  label: "Pending approvals",
  unit: "reqs",
  hint: "Awaiting admin review",
  icon: "hourglass_top" as MaterialIconName,
} as const;

export const ADMIN_TOTAL_STAT_ROW = {
  label: "Total users",
  unit: "seats",
  hintSuffix: "pending review",
  icon: "group" as MaterialIconName,
} as const;

export const ADMIN_PENDING_INFO_ROW = {
  icon: "info" as MaterialIconName,
  copy: "Accounts can't log in until approved. Decisions propagate immediately to the identity cluster.",
} as const;

export const ADMIN_PENDING_COLUMNS = [
  "Identity profile",
  "Telemetry state",
  "Requested",
  "Verification controls",
] as const;

export const ADMIN_PENDING_EMPTY_ROW = {
  icon: "done_all" as MaterialIconName,
  copy: "No pending approvals. You are all caught up.",
} as const;

export const ADMIN_PENDING_FOOTER_ROW = {
  statusLabel: "Identity sync daemon: operational",
  queueSuffix: "accounts queued for cryptographic provisioning",
} as const;

export const ADMIN_USERS_COLUMNS = [
  "User",
  "Role",
  "Status",
  "Last login",
  "Created",
  "Actions",
] as const;

export const ADMIN_ROLE_FILTER_ROWS: Array<{ id: string; label: string }> = [
  { id: "", label: "All roles" },
  { id: "DEVELOPER", label: "Developer" },
  { id: "ADMIN", label: "Administrator" },
];

export const ADMIN_SHOW_DEACTIVATED_LABEL = "Show deactivated";

export const ADMIN_SEARCH_PLACEHOLDER = "Search by name or email...";

export const ADMIN_EXPORT_ROW = {
  triggerLabel: "Export users as CSV",
  toastTitle: "Users exported",
  fileName: "users.csv",
} as const;

export const ADMIN_USERS_EMPTY_ROW = {
  icon: "group" as MaterialIconName,
  copy: "No users match the current filters.",
} as const;

export const ADMIN_SELF_ROW_LABEL = "YOU";

export const ADMIN_STATUS_PILLS: Record<AccountStatus, AdminStatusPillRow> = {
  PENDING: {
    label: "Pending",
    tone: "bg-champagne/12 text-champagne",
    dot: "bg-champagne",
  },
  ACTIVE: {
    label: "Active",
    tone: "bg-mint/12 text-mint",
    dot: "bg-mint",
  },
  REJECTED: {
    label: "Rejected",
    tone: "bg-crimson/12 text-crimson",
    dot: "bg-crimson",
  },
  DISABLED: {
    label: "Disabled",
    tone: "bg-orange/12 text-orange",
    dot: "bg-orange",
  },
};

export const ADMIN_ROLE_PILLS: Record<UserRole, AdminRolePillRow> = {
  DEVELOPER: {
    label: "Developer",
    icon: "code",
    tone: "bg-teal/15 text-tide",
  },
  ADMIN: {
    label: "Administrator",
    icon: "shield_person",
    tone: "bg-champagne/12 text-champagne",
  },
};

export const ADMIN_USERS_MENU_ROWS: AdminMenuRow[] = [
  { id: "edit", label: "Edit user", icon: "edit", tone: "ice" },
  { id: "role", label: "Change role", icon: "shield", tone: "ice" },
  { id: "deactivate", label: "Deactivate", icon: "person_off", tone: "crimson", dividerBefore: true },
  { id: "reactivate", label: "Reactivate", icon: "how_to_reg", tone: "mint", dividerBefore: true },
];

export const ADMIN_MENU_DISABLED_REASONS: Record<AdminMenuRow["id"], Record<string, string>> = {
  edit: {},
  role: {
    self: "You cannot change your own role",
  },
  deactivate: {
    self: "You cannot deactivate your own account",
    status: "Only active accounts can be deactivated",
  },
  reactivate: {
    status: "Only deactivated accounts can be reactivated",
  },
};

export const ADMIN_ACTION_KEYBOARD_LABEL = "Open user actions";

export const ADMIN_ROLE_OPTIONS: AdminRoleOptionRow[] = [
  {
    id: "DEVELOPER",
    icon: "code",
    title: "Developer",
    currentChip: "Current",
    idleChip: "",
    tileClasses: "bg-teal/15 text-tide",
    description: "Can create projects, run analyses, and inspect system telemetry stream pipelines.",
  },
  {
    id: "ADMIN",
    icon: "shield_person",
    title: "Administrator",
    currentChip: "Current",
    idleChip: "Root tier",
    tileClasses: "bg-champagne/10 text-champagne",
    description: "Can approve users, revoke access, and administer workspace credentials.",
  },
];

export const ADMIN_ROLE_MODAL_ROW = {
  kicker: "RBAC privileges · Node assignment",
  title: "Change role",
  targetLabel: "Target:",
  cancelLabel: "Cancel",
  submitLabel: "Change role",
  submitIcon: "verified_user" as MaterialIconName,
  advisoryIcon: "warning" as MaterialIconName,
  advisoryLabel: "Security clearance advisory",
  advisoryCopy: "Administrators have full access to user management and critical telemetry mutations.",
  errorHeading: "Operation aborted",
  errorCloseLabel: "Dismiss error",
} as const;

export const ADMIN_EDIT_PANEL_ROW = {
  title: "Edit user",
  closeLabel: "Close panel",
  nameFieldLabel: "Full name",
  nameHint: "2 to 100 characters",
  nameMinLengthError: "Name must be at least 2 characters",
  nameMaxLength: 100,
  cancelLabel: "Cancel",
  submitLabel: "Save changes",
  submitIcon: "check" as MaterialIconName,
  infoHeading: "Account information",
} as const;

export const ADMIN_STATUS_MODAL_ROWS: Record<AdminStatusModalMode, AdminStatusModalRow> = {
  deactivate: {
    kicker: "A. Deactivate account",
    titleVerb: "Deactivate",
    icon: "person_off",
    accentClasses: "from-crimson/70 via-crimson/20 to-transparent",
    iconTileClasses: "border-crimson/40 bg-crimson/12 text-crimson",
    actionCode: "Action code: revoke_access_suspend",
    copy: "They won't be able to log in. Their projects, analyses and history are kept. You can reactivate the account at any time.",
    cancelLabel: "Cancel",
    confirmLabel: "Deactivate",
    confirmIcon: "block",
    confirmVariant: "crimson",
  },
  reactivate: {
    kicker: "B. Reactivate account",
    titleVerb: "Reactivate",
    icon: "person_check",
    accentClasses: "from-frost-mid/60 via-teal/20 to-transparent",
    iconTileClasses: "border-frost-mid/40 bg-frost-mid/10 text-frost-mid",
    actionCode: "Action code: restore_access_permit",
    copy: "They will be able to log in again and see their previous projects.",
    cancelLabel: "Cancel",
    confirmLabel: "Reactivate",
    confirmIcon: "how_to_reg",
    confirmVariant: "mint",
  },
};

export const ADMIN_GOVERNANCE_ROWS: AdminGovernanceRow[] = [
  {
    id: "sso",
    icon: "shield",
    label: "SSO & OIDC enforcement",
    copy: "Strict hardware MFA required for all approved accounts.",
  },
  {
    id: "logging",
    icon: "fact_check",
    label: "Immutable logging",
    copy: "Approval events signed with root certificate #A992.",
  },
  {
    id: "edge",
    icon: "hub",
    label: "Edge cluster status",
    copy: "All 14 availability zones synchronized.",
  },
];

export const ADMIN_AUDIT_BANNER_ROW = {
  icon: "verified_user" as MaterialIconName,
  title: "Immutable audit trail enforced",
  copy: "All membership changes, privilege modifications, and approvals are cryptographically logged.",
} as const;

export const ADMIN_SIDEBAR_ROW = {
  label: "Administration",
  href: "/admin",
  icon: "shield" as MaterialIconName,
} as const;

export const ADMIN_MISSING_LABEL = "Never";

export const ADMIN_QUERY_FALLBACK = {
  loadingPending: "Loading pending approvals…",
  loadingUsers: "Loading users…",
  errorPending: "Could not load pending approvals.",
  errorUsers: "Could not load users.",
  retry: "Retry",
} as const;
