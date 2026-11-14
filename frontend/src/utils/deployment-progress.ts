interface AttemptLike {
  status: string;
}

interface MonitoringLike {
  status: string;
  components: readonly { health: string }[];
}

export function hasAppliedDeployment(attempts: readonly AttemptLike[]): boolean {
  return attempts.some((attempt) => attempt.status === "APPLIED");
}

export function isDeploymentHealthy(result: MonitoringLike | undefined): boolean {
  return (
    result?.status === "AVAILABLE" &&
    result.components.length > 0 &&
    result.components.every((component) => component.health === "HEALTHY")
  );
}
