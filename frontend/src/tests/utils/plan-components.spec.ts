import { describe, expect, it } from "vitest";
import {
  changedComponents,
  componentUpdateBody,
  editablePlanComponent,
  nextPlanVersion,
  planEditMode,
} from "@/utils/plan-components";
import type { DeploymentPlan, PlanComponent } from "@/types/deployment-plan";

const COMPONENT = {
  name: "web",
  type: "FRONTEND",
  containerPort: 80,
  servicePort: null,
  targetPort: 80,
  image: "ghcr.io/acme/web:plan-v1",
  replicas: 1,
  resources: {
    requests: { cpu: "100m", memory: "128Mi" },
    limits: { cpu: "200m", memory: "256Mi" },
  },
  hpa: { enabled: false, minReplicas: null },
  ingress: { enabled: false, tls: false, host: null },
  id: "server-only-field",
} as unknown as PlanComponent;

function plan(status: DeploymentPlan["status"], version: number): DeploymentPlan {
  return {
    id: `plan-${version}`,
    project: "p",
    analysis: "a",
    version,
    status,
    components: [COMPONENT],
    recommendations: [],
    createdBy: "u",
  } as unknown as DeploymentPlan;
}

describe("plan components", () => {
  it("keeps existing values but drops server-only and empty fields", () => {
    const editable = editablePlanComponent(COMPONENT);
    expect(editable).not.toHaveProperty("id");
    expect(editable.hpa).toEqual({ enabled: false });
    expect(editable.ingress).toEqual({ enabled: false, tls: false });
    expect(editable.image).toBe("ghcr.io/acme/web:plan-v1");
    expect(editable.resources.limits.memory).toBe("256Mi");
  });

  it("builds an update body without the component name", () => {
    const body = componentUpdateBody({ ...COMPONENT, image: "  img:2  " });
    expect(body).not.toHaveProperty("name");
    expect(body.image).toBe("img:2");
    expect(body.replicas).toBe(1);
  });

  it("only reports components whose values changed", () => {
    const edited = [{ ...editablePlanComponent(COMPONENT), replicas: 3 }];
    expect(changedComponents([COMPONENT], [editablePlanComponent(COMPONENT)])).toEqual([]);
    expect(changedComponents([COMPONENT], edited).map((c) => c.replicas)).toEqual([3]);
  });

  it("updates drafts in place and versions approved or rejected plans", () => {
    expect(planEditMode(null)).toBe("create");
    expect(planEditMode(plan("DRAFT", 1))).toBe("update");
    expect(planEditMode(plan("APPROVED", 1))).toBe("version");
    expect(planEditMode(plan("REJECTED", 1))).toBe("version");
    expect(nextPlanVersion([plan("APPROVED", 1), plan("DRAFT", 3)])).toBe(4);
    expect(nextPlanVersion([])).toBe(1);
  });
});
