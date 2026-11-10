/** Lifecycle of a deployment plan (machine: defineStateMachine).
 * DRAFT -> APPROVED | REJECTED; APPROVED -> SUPERSEDED. */
export const PLAN_STATUSES = ['DRAFT', 'APPROVED', 'REJECTED', 'SUPERSEDED'] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

/** Component type in a plan (the deployable part of the analyzed app). */
export const PLAN_COMPONENT_TYPES = ['FRONTEND', 'BACKEND', 'DATABASE', 'WORKER', 'OTHER'] as const;
export type PlanComponentType = (typeof PLAN_COMPONENT_TYPES)[number];

/**
 * Deterministic default container port per component type, used when drafting
 * a plan v1 from a completed analysis (the analysis does not carry ports).
 * The registry (not a switch) keeps adding new types an O(1) edit.
 */
export const PLAN_COMPONENT_DEFAULT_PORTS: Record<PlanComponentType, number> = {
  FRONTEND: 3000,
  BACKEND: 3000,
  DATABASE: 5432,
  WORKER: 8080,
  OTHER: 8080,
};

/** Draft v1 baseline for component replicas before any review tuning. */
export const PLAN_COMPONENT_DEFAULT_REPLICAS = 2 as const;
