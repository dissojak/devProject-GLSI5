"use client";

import { DeploymentsBoardContent } from "@/components/pipeline/deployments-board-content";
import { PipelineAuthGate } from "@/components/pipeline/pipeline-auth-gate";

export function DeploymentsBoard() {
  return (
    <PipelineAuthGate>
      <DeploymentsBoardContent />
    </PipelineAuthGate>
  );
}
