"use client";

import { AnalysesBoardContent } from "@/components/pipeline/analyses-board-content";
import { PipelineAuthGate } from "@/components/pipeline/pipeline-auth-gate";

export function AnalysesBoard() {
  return (
    <PipelineAuthGate>
      <AnalysesBoardContent />
    </PipelineAuthGate>
  );
}
