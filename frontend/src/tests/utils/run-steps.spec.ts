import { describe, expect, it } from "vitest";
import { runStepState, stepDuration } from "@/utils/run-steps";

describe("run steps", () => {
  it("maps GitHub status and conclusion to a step state", () => {
    expect(runStepState("completed", "success")).toBe("success");
    expect(runStepState("completed", "failure")).toBe("failure");
    expect(runStepState("completed", "cancelled")).toBe("failure");
    expect(runStepState("completed", "skipped")).toBe("skipped");
    expect(runStepState("in_progress", null)).toBe("running");
    expect(runStepState("queued", null)).toBe("queued");
  });

  it("formats step durations like GitHub", () => {
    expect(stepDuration("2026-11-14T10:00:00Z", "2026-11-14T10:00:18Z")).toBe("18s");
    expect(stepDuration("2026-11-14T10:00:00Z", "2026-11-14T10:01:05Z")).toBe("1m 5s");
    expect(stepDuration("2026-11-14T10:00:00Z", null)).toBe("");
  });
});
