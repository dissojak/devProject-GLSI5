"use client";

import { PlansBoardContent } from "@/components/pipeline/plans-board-content";
import { PipelineAuthGate } from "@/components/pipeline/pipeline-auth-gate";

export function PlansBoard() {
  return (
    <PipelineAuthGate>
      <PlansBoardContent />
    </PipelineAuthGate>
  );
}
