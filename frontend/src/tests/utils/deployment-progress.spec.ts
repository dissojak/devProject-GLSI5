import { describe, expect, it } from "vitest";
import { hasAppliedDeployment, isDeploymentHealthy } from "@/utils/deployment-progress";

describe("deployment progress", () => {
  it("detects an applied deployment attempt", () => {
    expect(hasAppliedDeployment([{ status: "FAILED" }, { status: "APPLIED" }])).toBe(true);
    expect(hasAppliedDeployment([{ status: "STARTED" }, { status: "FAILED" }])).toBe(false);
    expect(hasAppliedDeployment([])).toBe(false);
  });

  it("is healthy only when the cluster answers and every component is healthy", () => {
    const healthy = { status: "AVAILABLE", components: [{ health: "HEALTHY" }, { health: "HEALTHY" }] };
    expect(isDeploymentHealthy(healthy)).toBe(true);
    expect(isDeploymentHealthy({ ...healthy, components: [{ health: "HEALTHY" }, { health: "PROGRESSING" }] })).toBe(false);
    expect(isDeploymentHealthy({ status: "UNAVAILABLE", components: [{ health: "HEALTHY" }] })).toBe(false);
    expect(isDeploymentHealthy({ status: "AVAILABLE", components: [] })).toBe(false);
    expect(isDeploymentHealthy(undefined)).toBe(false);
  });
});
