export type RunStepState = "success" | "failure" | "running" | "queued" | "skipped";

export function runStepState(status: string, conclusion: string | null): RunStepState {
  if (status !== "completed") return status === "in_progress" ? "running" : "queued";
  if (conclusion === "success") return "success";
  if (conclusion === "skipped" || conclusion === "neutral") return "skipped";
  return "failure";
}

export function stepDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return "";
  const seconds = Math.max(0, Math.round((Date.parse(completedAt) - Date.parse(startedAt)) / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}
