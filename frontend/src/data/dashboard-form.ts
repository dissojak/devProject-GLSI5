import type { EnvironmentTone } from "@/types/dashboard";

export const PROJECT_MODAL_ROW = {
  title: "New project",
  closeLabel: "Close dialog",
  nameLabel: "Project name",
  nameRequired: "*",
  slugHint: "Slug compatible",
  namePlaceholder: "shopflow-store",
  conflictHeading: "Conflict Check Preview",
  conflictCode: "HTTP 409",
  conflictCodeLabel: "name conflict",
  conflictPlaceholder: "shopflow-store",
  conflictMessage: "A project with this name already exists.",
  descriptionLabel: "Description",
  descriptionHint: "(optional)",
  descriptionPlaceholder: "Brief summary of what this application does...",
  environmentLabel: "Environment",
  environmentHint: "active",
  environmentMenuHeading: "Select Primary Tier",
  cancelLabel: "Cancel",
  submitLabel: "Create project",
  submitIcon: "add_circle",
} as const;

export interface EnvironmentOptionRow {
  id: EnvironmentTone;
  label: string;
  badge: string;
  badgeAccent: "tide" | "champagneBright" | "mint" | null;
  dotModerator: string;
}

export const ENVIRONMENT_OPTION_ROWS: EnvironmentOptionRow[] = [
  {
    id: "development",
    label: "Development",
    badge: "",
    badgeAccent: null,
    dotModerator: "bg-teal shadow-teal-dot",
  },
  {
    id: "staging",
    label: "Staging",
    badge: "PRE-PROD",
    badgeAccent: "champagneBright",
    dotModerator: "bg-champagne",
  },
  {
    id: "production",
    label: "Production",
    badge: "LIVE",
    badgeAccent: "mint",
    dotModerator: "bg-mint",
  },
];
