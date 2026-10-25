import type { MaterialIconName } from "@/types/icons";

export type EnvironmentTone = "development" | "staging" | "production";

export type DashboardFilterId = EnvironmentTone | "all";

export type DashboardViewMode = "grid" | "list";

export type NavItemKind = "active" | "soon";

export type StatAccent = "total" | EnvironmentTone;

export interface DashboardNavRow {
  id: string;
  label: string;
  href?: string;
  icon: MaterialIconName;
  kind: NavItemKind;
}

export interface DashboardBrandRow {
  name: string;
  tagline: string;
  sectionLabel: string;
}

export interface CrumbRow {
  brandContext: string;
  label: string;
}

export interface SearchRow {
  label: string;
  placeholder: string;
  notificationsLabel: string;
}

export type UserMenuRoleKind = "admin" | "developer" | "other";

export interface UserMenuItemRow {
  id: string;
  label: string;
  icon: MaterialIconName;
  href?: string;
  badge?: string;
  externalMark?: boolean;
}

export interface UserMenuSectionRow {
  id: string;
  label: string;
  items: UserMenuItemRow[];
}

export interface UserBadgeRow {
  label?: string;
  classes: string;
}

export interface GreetingRow {
  title: string;
  subtitle: string;
  actionLabel: string;
}

export interface DashboardStatRow {
  id: string;
  label: string;
  value: string;
  suffix: string;
  accent: StatAccent;
  icon: MaterialIconName | null;
  iconBadge: boolean;
}

export interface DashboardHeadingRow {
  heading: string;
  countLabel: string;
}

export interface EnvironmentFilterRow {
  id: DashboardFilterId;
  label: string;
}

export interface ProjectRow {
  id: string;
  name: string;
  description: string;
  environment: EnvironmentTone;
  createdAt: string;
}

export interface PaginationRow {
  pages: number[];
  current: number;
  previousLabel: string;
  nextLabel: string;
  statusLabel: string;
}

export interface ViewToggleRow {
  id: DashboardViewMode;
  label: string;
  icon: MaterialIconName;
}

export interface EmptyStatVisualRow {
  ringLabelLeft: string;
  ringLabelRight: string;
  heading: string;
  copy: string;
  actionLabel: string;
}

export interface TelemetryRow {
  id: string;
  label: string;
  icon: MaterialIconName;
  iconAccent: "frostMid" | "tide" | "champagneBright";
}
