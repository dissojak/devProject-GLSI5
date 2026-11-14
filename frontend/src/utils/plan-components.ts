import type {
  DeploymentPlan,
  PlanComponent,
  UpdatePlanComponentBody,
} from "@/types/deployment-plan";

export type PlanEditMode = "create" | "update" | "version";

function withoutEmpty<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== undefined && field !== null),
  ) as T;
}

export function editablePlanComponent(component: PlanComponent): PlanComponent {
  return {
    name: component.name,
    type: component.type,
    containerPort: component.containerPort,
    servicePort: component.servicePort ?? null,
    targetPort: component.targetPort ?? null,
    image: component.image ?? undefined,
    replicas: component.replicas,
    resources: {
      requests: {
        cpu: component.resources.requests.cpu,
        memory: component.resources.requests.memory,
      },
      limits: {
        cpu: component.resources.limits.cpu,
        memory: component.resources.limits.memory,
      },
    },
    hpa: withoutEmpty({
      enabled: component.hpa.enabled,
      minReplicas: component.hpa.minReplicas,
      maxReplicas: component.hpa.maxReplicas,
      targetCpuUtilizationPercent: component.hpa.targetCpuUtilizationPercent,
      targetMemoryUtilizationPercent: component.hpa.targetMemoryUtilizationPercent,
    }),
    ingress: withoutEmpty({
      enabled: component.ingress.enabled,
      host: component.ingress.host,
      path: component.ingress.path,
      tls: component.ingress.tls,
    }),
  };
}

export function componentUpdateBody(component: PlanComponent): UpdatePlanComponentBody {
  const editable = editablePlanComponent(component);
  return {
    containerPort: editable.containerPort,
    servicePort: editable.servicePort ?? null,
    targetPort: editable.targetPort ?? null,
    image: editable.image?.trim() ?? "",
    replicas: editable.replicas,
    resources: editable.resources,
    hpa: editable.hpa,
    ingress: editable.ingress,
  };
}

export function changedComponents(
  original: readonly PlanComponent[],
  edited: readonly PlanComponent[],
): PlanComponent[] {
  return edited.filter((component) => {
    const before = original.find((item) => item.name === component.name);
    return (
      !before ||
      JSON.stringify(editablePlanComponent(before)) !== JSON.stringify(editablePlanComponent(component))
    );
  });
}

export function planEditMode(base: DeploymentPlan | null): PlanEditMode {
  if (!base) return "create";
  return base.status === "DRAFT" ? "update" : "version";
}

export function nextPlanVersion(plans: readonly DeploymentPlan[]): number {
  return plans.reduce((highest, plan) => Math.max(highest, plan.version), 0) + 1;
}
