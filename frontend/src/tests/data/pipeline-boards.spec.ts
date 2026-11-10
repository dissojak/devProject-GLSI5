import { describe, expect, it } from "vitest";
import {
  PIPELINE_FILTER_ALL_ID,
  PIPELINE_FILTER_EMPTY_NOTE,
  PIPELINE_PAGINATION_ROW,
  PIPELINE_SYNCING_NOTE,
} from "@/data/pipeline-boards";import {
  ANALYSES_ERROR_ROW,
  ANALYSES_FILTER_ROWS,
  ANALYSES_LOADING_ROW,
  ANALYSES_STAGE_ROW,
  ANALYSES_TABLE_COLUMNS,
  ANALYSES_EMPTY_ROW,
  ANALYSIS_LIVE_STATUS,
  ANALYSIS_STATUS_CHIPS,
} from "@/data/analyses-board";
import {
  PLAN_ACTION_ICONS,
  PLAN_ACTION_LABELS,
  PLAN_ACTION_ROWS,
  PLAN_ACTION_TOASTS,
  PLAN_ACTION_VARIANTS,
  PLAN_COMPONENT_TYPE_CHIPS,
  PLAN_DEPLOY_TARGETS,
  PLAN_REJECT_FORM_ROW,
  PLAN_STATUS_CHIPS,
  PLAN_TOAST_ROWS,
  PLANS_ERROR_ROW,
  PLANS_LOADING_ROW,
  PLANS_STAGE_ROW,
  PLANS_TABLE_COLUMNS,
  PLANS_EMPTY_ROW,
} from "@/data/plans-board";
import {
  ARGO_HEALTH_CHIPS,
  ARGO_SYNC_CHIPS,
  DEPLOYMENTS_ERROR_ROW,
  DEPLOYMENTS_FILTER_ROWS,
  DEPLOYMENTS_LOADING_ROW,
  DEPLOYMENTS_STAGE_ROW,
  DEPLOYMENTS_TABLE_COLUMNS,
  DEPLOYMENTS_EMPTY_ROW,
  DEPLOYMENT_CANCELLABLE,
  DEPLOYMENT_ENVIRONMENT_BORDERS,
  DEPLOYMENT_ENVIRONMENT_CHIPS,
  DEPLOYMENT_LIVE_STATUS,
  DEPLOYMENT_STATUS_CHIPS,
  DEPLOYMENT_TOAST_ROWS,
} from "@/data/deployments-board";
import type { AnalysisStatus } from "@/types/analysis";
import type { PlanStatus } from "@/types/plan";
import type { DeploymentStatus } from "@/types/deployment";
import type { ProjectEnvironment } from "@/types/project";

const ANALYSIS_STATUSES: AnalysisStatus[] = ["PENDING", "RUNNING", "COMPLETED", "FAILED"];
const PLAN_STATUSES: PlanStatus[] = ["DRAFT", "APPROVED", "REJECTED", "SUPERSEDED"];
const DEPLOYMENT_STATUSES: DeploymentStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
];
const ENVIRONMENTS: ProjectEnvironment[] = ["DEVELOPMENT", "STAGING", "PRODUCTION"];

describe("pipeline board rows", () => {
  it("orders the boards as the pipeline's three stages", () => {
    expect(ANALYSES_STAGE_ROW).toMatchObject({ stage: "Stage 01", kind: "Evidence" });
    expect(PLANS_STAGE_ROW).toMatchObject({ stage: "Stage 02", kind: "Contract" });
    expect(DEPLOYMENTS_STAGE_ROW).toMatchObject({ stage: "Stage 03", kind: "Rollout" });
    expect(PIPELINE_PAGINATION_ROW).toEqual({ previousLabel: "Previous", nextLabel: "Next" });
    expect(PIPELINE_FILTER_ALL_ID).toBe("all");
    expect(PIPELINE_FILTER_EMPTY_NOTE).toContain("filter");
    expect(PIPELINE_SYNCING_NOTE.length).toBeGreaterThan(0);
  });

  it("keeps the analysis vocabulary complete", () => {
    expect(ANALYSES_FILTER_ROWS[0]).toMatchObject({ id: "all", label: "All" });
    // Live statuses lead the strip; terminal ones trail.
    expect(ANALYSES_FILTER_ROWS.slice(1).map((row) => row.id)).toEqual([
      "RUNNING",
      "PENDING",
      "COMPLETED",
      "FAILED",
    ]);
    expect(Object.keys(ANALYSIS_STATUS_CHIPS)).toEqual(ANALYSIS_STATUSES);
    expect(Object.keys(ANALYSIS_LIVE_STATUS)).toEqual(ANALYSIS_STATUSES);
    expect(ANALYSIS_LIVE_STATUS.RUNNING).toBe(true);
    expect(ANALYSIS_LIVE_STATUS.COMPLETED).toBe(false);
    expect(ANALYSES_TABLE_COLUMNS.map((column) => column.label)).toEqual([
      "#",
      "Project",
      "Status",
      "Branch",
      "Technologies",
      "Duration",
      "Started",
    ]);
    expect(ANALYSES_EMPTY_ROW).toMatchObject({ icon: "analytics" });
    expect(ANALYSES_ERROR_ROW).toMatchObject({ icon: "warning", actionLabel: "Try again" });
    expect(ANALYSES_LOADING_ROW).toMatchObject({ icon: "radar" });
  });

  it("encodes plan actions as a status registry, never a branch", () => {
    expect(PLAN_ACTION_ROWS.DRAFT).toEqual(["approve", "reject"]);
    expect(PLAN_ACTION_ROWS.APPROVED).toEqual(["revise"]);
    expect(PLAN_ACTION_ROWS.REJECTED).toEqual(["revise"]);
    expect(PLAN_ACTION_ROWS.SUPERSEDED).toEqual([]);
    for (const status of PLAN_STATUSES) {
      for (const action of PLAN_ACTION_ROWS[status]) {
        expect(PLAN_ACTION_LABELS[action].length).toBeGreaterThan(0);
        expect(PLAN_ACTION_ICONS[action].length).toBeGreaterThan(0);
        expect(PLAN_ACTION_VARIANTS[action].length).toBeGreaterThan(0);
      }
    }
    expect(PLAN_ACTION_VARIANTS.approve).toBe("mint");
    expect(PLAN_ACTION_VARIANTS.reject).toBe("crimson");
    expect(PLAN_ACTION_VARIANTS.revise).toBe("champagne");
    expect(PLAN_DEPLOY_TARGETS.map((row) => row.environment)).toEqual(ENVIRONMENTS);
    expect(PLAN_REJECT_FORM_ROW.action).toBe("Confirm rejection");
    expect(PLAN_REJECT_FORM_ROW.cancel).toBe("Cancel");
    expect(Object.keys(PLAN_STATUS_CHIPS)).toEqual(PLAN_STATUSES);
    expect(Object.keys(PLAN_COMPONENT_TYPE_CHIPS)).toEqual([
      "FRONTEND",
      "BACKEND",
      "DATABASE",
      "WORKER",
      "OTHER",
    ]);
    expect(PLANS_TABLE_COLUMNS.map((column) => column.label)).toEqual([
      "Version",
      "Project",
      "Status",
      "Components",
      "Created",
    ]);
    expect(PLANS_EMPTY_ROW).toMatchObject({ icon: "schema" });
    expect(PLANS_ERROR_ROW).toMatchObject({ icon: "warning", actionLabel: "Try again" });
    expect(PLANS_LOADING_ROW).toMatchObject({ icon: "radar" });
  });

  it("gives every plan toast a tone and title", () => {
    for (const row of Object.values(PLAN_TOAST_ROWS)) {
      expect(row.tone).toBeTruthy();
      expect(row.title.length).toBeGreaterThan(0);
      const copy = "message" in row ? row.message : row.fallback;
      expect(copy.length).toBeGreaterThan(0);
    }
    expect(PLAN_ACTION_TOASTS.approve).toBe(PLAN_TOAST_ROWS.approved);
    expect(PLAN_ACTION_TOASTS.revise).toBe(PLAN_TOAST_ROWS.revised);
  });

  it("marks only young deployments cancellable and paints environments", () => {
    expect(DEPLOYMENT_CANCELLABLE.PENDING).toBe(true);
    expect(DEPLOYMENT_CANCELLABLE.IN_PROGRESS).toBe(true);
    expect(DEPLOYMENT_CANCELLABLE.SUCCEEDED).toBe(false);
    expect(DEPLOYMENT_CANCELLABLE.FAILED).toBe(false);
    expect(DEPLOYMENT_CANCELLABLE.CANCELLED).toBe(false);
    expect(Object.keys(DEPLOYMENT_STATUS_CHIPS)).toEqual(DEPLOYMENT_STATUSES);
    expect(Object.keys(DEPLOYMENT_LIVE_STATUS)).toEqual(DEPLOYMENT_STATUSES);
    expect(DEPLOYMENT_LIVE_STATUS.IN_PROGRESS).toBe(true);
    expect(DEPLOYMENT_LIVE_STATUS.CANCELLED).toBe(false);
    expect(Object.keys(DEPLOYMENT_ENVIRONMENT_CHIPS)).toEqual(ENVIRONMENTS);
    expect(Object.keys(DEPLOYMENT_ENVIRONMENT_BORDERS)).toEqual(ENVIRONMENTS);
    // Border and chip share the accent so a row reads by its left edge.
    expect(DEPLOYMENT_ENVIRONMENT_BORDERS.DEVELOPMENT).toContain("teal");
    expect(DEPLOYMENT_ENVIRONMENT_BORDERS.STAGING).toContain("champagne");
    expect(DEPLOYMENT_ENVIRONMENT_BORDERS.PRODUCTION).toContain("lavender");
    expect(DEPLOYMENT_ENVIRONMENT_CHIPS.DEVELOPMENT.classes).toContain("text-teal");
    expect(DEPLOYMENT_ENVIRONMENT_CHIPS.STAGING.classes).toContain("text-champagne");
    expect(DEPLOYMENT_ENVIRONMENT_CHIPS.PRODUCTION.classes).toContain("text-lavender");
    expect(Object.keys(ARGO_SYNC_CHIPS)).toEqual(["SYNCED", "OUT_OF_SYNC", "UNKNOWN"]);
    expect(Object.keys(ARGO_HEALTH_CHIPS)).toEqual([
      "HEALTHY",
      "PROGRESSING",
      "DEGRADED",
      "SUSPENDED",
      "MISSING",
      "UNKNOWN",
    ]);
    expect(DEPLOYMENTS_FILTER_ROWS[0]).toMatchObject({ id: "all", label: "All" });
    expect(DEPLOYMENTS_FILTER_ROWS.slice(1).map((row) => row.id)).toEqual([
      "IN_PROGRESS",
      "PENDING",
      "SUCCEEDED",
      "FAILED",
      "CANCELLED",
    ]);
    expect(DEPLOYMENTS_TABLE_COLUMNS.map((column) => column.label)).toEqual([
      "Environment",
      "Project",
      "Status",
      "Plan",
      "Argo",
      "Duration",
      "Started",
    ]);
    expect(DEPLOYMENTS_EMPTY_ROW).toMatchObject({ icon: "alt_route" });
    expect(DEPLOYMENTS_ERROR_ROW).toMatchObject({ icon: "warning", actionLabel: "Try again" });
    expect(DEPLOYMENTS_LOADING_ROW).toMatchObject({ icon: "radar" });
    expect(DEPLOYMENT_TOAST_ROWS.cancelled.tone).toBe("champagne");
    expect(DEPLOYMENT_TOAST_ROWS.failed.tone).toBe("crimson");
  });
});
