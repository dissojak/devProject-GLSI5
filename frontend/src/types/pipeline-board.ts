import type { MaterialIconName } from "@/types/icons";

/** The mono eyebrow: the stage number and what the stage yields. */
export interface PipelineStageRow {
  stage: string;
  kind: string;
  title: string;
  subtitle: string;
}

export interface PipelineFilterRow {
  id: string;
  label: string;
}

export interface StatusChipRow {
  label: string;
  classes: string;
}

export interface PipelineColumnRow {
  id: string;
  label: string;
}

/** A row-level action (label + icon + button variant); registries map status → row | null. */
export interface StatusActionRow {
  label: string;
  icon: MaterialIconName;
  variant: "primary" | "champagne" | "teal" | "crimson" | "mint";
}

export interface PipelineEmptyRow {
  icon: MaterialIconName;
  heading: string;
  copy: string;
  actionLabel: string;
}

export interface PipelineErrorRow {
  icon: MaterialIconName;
  heading: string;
  copy: string;
  actionLabel: string;
}

export interface PipelineLoadingRow {
  icon: MaterialIconName;
  heading: string;
  copy: string;
}

export interface PipelineBoardState<TData> {
  data: TData | undefined;
  loading: boolean;
  refetching: boolean;
  error: string | null;
  refetch: () => void;
}
