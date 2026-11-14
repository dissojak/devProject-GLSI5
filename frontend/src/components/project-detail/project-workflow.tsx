"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  PROJECT_LOCK_REASONS,
  PROJECT_PHASES,
  PROJECT_STEP_RULES,
  PROJECT_WORKFLOW_STEPS,
} from "@/data/project-workflow";
import { useListDeploymentPlansQuery } from "@/hooks/use-deployment-plans";
import { useInspectDockerfileProposalsQuery } from "@/hooks/use-dockerfile-proposals";
import { useListKubernetesManifestsQuery } from "@/hooks/use-kubernetes-manifests";
import { useListRecommendationsQuery } from "@/hooks/use-recommendations";
import {
  phaseEntryStep,
  phaseOfStep,
  resolveWorkflowSteps,
  resumeStepIndex,
} from "@/utils/workflow-steps";
import { DockerfileProposalsSection } from "@/components/project-detail/dockerfile-proposals-section";
import { DeploymentPlanSection } from "@/components/project-detail/deployment-plan-section";
import { CicdSection } from "@/components/project-detail/cicd-section";
import { KubernetesManifestSection } from "@/components/project-detail/kubernetes-manifest-section";
import { KubernetesServerValidation } from "@/components/project-detail/kubernetes-server-validation";
import { KubernetesDeployment } from "@/components/project-detail/kubernetes-deployment";
import { KubernetesMonitoring } from "@/components/project-detail/kubernetes-monitoring";
import { KubernetesDeploymentHistory } from "@/components/project-detail/kubernetes-deployment-history";
import { WorkflowSteps } from "@/components/project-detail/workflow-steps";
import { WorkflowChecklist } from "@/components/project-detail/workflow-checklist";
import { WorkflowPhaseNav } from "@/components/project-detail/workflow-phase-nav";
import type { Analysis } from "@/types/analysis";
import type { Project } from "@/types/project";
import type { ProjectStepId, WorkflowNavigation, WorkflowStepView } from "@/types/workflow";

interface ProjectWorkflowProps {
  project: Project;
  analysis: Analysis | null;
  analysesReady: boolean;
  repositoryPanel: ReactNode;
  repositoryAlert: ReactNode;
  analysisPanel: ReactNode;
  recommendationsPanel: ReactNode;
  navigation: WorkflowNavigation<ProjectStepId> | null;
  onNavigate: (id: ProjectStepId) => void;
  activeId: ProjectStepId | null;
  onActiveChange: (id: ProjectStepId) => void;
}

type RailStepId = Exclude<ProjectStepId, "repository">;

const RAIL_IDS: readonly ProjectStepId[] = PROJECT_WORKFLOW_STEPS.map((step) => step.id).filter(
  (id) => id !== "repository",
);

const PHASE_OF_STEP: Partial<Record<ProjectStepId, string>> = Object.fromEntries(
  PROJECT_PHASES.flatMap((phase) => phase.stepIds.map((id) => [id, phase.id])),
);

function isRailStep(step: WorkflowStepView<ProjectStepId>): step is WorkflowStepView<RailStepId> {
  return step.id !== "repository";
}

export function ProjectWorkflow({
  project,
  analysis,
  analysesReady,
  repositoryPanel,
  repositoryAlert,
  analysisPanel,
  recommendationsPanel,
  navigation,
  onNavigate,
  activeId,
  onActiveChange,
}: ProjectWorkflowProps) {
  const projectId = project.id;
  const completedAnalysis = analysis?.status === "COMPLETED" ? analysis : null;
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const plansQuery = useListDeploymentPlansQuery({ projectId });
  const plans = plansQuery.data?.data ?? [];
  const plan = plans.find((item) => item.id === selectedPlanId) ?? plans[0] ?? null;
  const planId = plan?.id ?? "";
  const approved = plan?.status === "APPROVED";

  const dockerQuery = useInspectDockerfileProposalsQuery(
    { projectId, analysisId: completedAnalysis?.id ?? "" },
    { skip: !completedAnalysis },
  );
  const recommendationsQuery = useListRecommendationsQuery(
    { projectId, analysisId: completedAnalysis?.id ?? "" },
    { skip: !completedAnalysis },
  );
  const recommendations = recommendationsQuery.data?.data ?? [];
  const manifestsQuery = useListKubernetesManifestsQuery({ projectId, planId }, { skip: !approved });
  const files = manifestsQuery.data?.data ?? [];
  const validManifests =
    approved && files.length > 0 && files.every((file) => file.validation.status === "VALID");

  const steps = resolveWorkflowSteps(
    PROJECT_WORKFLOW_STEPS,
    PROJECT_STEP_RULES,
    {
      verifiedRepository: Boolean(project.repository?.isValid),
      completedAnalysis: completedAnalysis !== null,
      reviewedRecommendations:
        recommendations.length > 0 && recommendations.every((item) => item.status !== "PENDING"),
      dockerReady:
        Boolean(completedAnalysis?.docker.hasDockerfile) ||
        (dockerQuery.data?.data.generated.length ?? 0) > 0,
      approvedPlan: approved,
      validManifests,
    },
    PROJECT_LOCK_REASONS,
  );

  const [booted, setBooted] = useState(false);
  const ready =
    analysesReady &&
    !plansQuery.isLoading &&
    !dockerQuery.isLoading &&
    !recommendationsQuery.isLoading &&
    !manifestsQuery.isLoading;
  if (ready && !booted) setBooted(true);

  if (!ready && !booted) {
    return (
      <div className="rounded-2xl border border-steel bg-panel p-6 shadow-md">
        <p role="status" className="font-display text-body-md text-mist">Loading workflow…</p>
      </div>
    );
  }

  const ids = { projectId, planId };
  const panels: Record<RailStepId, () => ReactNode> = {
    analysis: () => analysisPanel,
    recommendations: () => recommendationsPanel,
    docker: () => (
      <DockerfileProposalsSection projectId={projectId} analysisId={completedAnalysis?.id ?? ""} />
    ),
    plan: () => (
      <DeploymentPlanSection
        key={completedAnalysis?.id ?? "no-analysis"}
        projectId={projectId}
        analysis={completedAnalysis}
        selectedPlanId={plan?.id ?? null}
        onSelectPlan={setSelectedPlanId}
      />
    ),
    cicd: () => <CicdSection key={`cicd-${planId}`} {...ids} approved={approved} />,
    manifests: () => <KubernetesManifestSection key={planId} {...ids} approved={approved} />,
    "server-validation": () => <KubernetesServerValidation {...ids} eligible={validManifests} />,
    deploy: () => <KubernetesDeployment {...ids} eligible={validManifests} />,
    monitoring: () => <KubernetesMonitoring {...ids} approved={approved} />,
    history: () => <KubernetesDeploymentHistory {...ids} approved={approved} />,
  };

  const railSteps = steps.filter(isRailStep);
  const requested = navigation ? railSteps.findIndex((step) => step.id === navigation.id) : -1;
  const initialIndex = requested >= 0 ? requested : resumeStepIndex(railSteps);

  return (
    <div className="flex flex-col gap-6">
      <WorkflowPhaseNav
        phases={PROJECT_PHASES}
        steps={steps}
        activePhase={activeId ? phaseOfStep(PROJECT_PHASES, activeId) : undefined}
        onSelect={(phase) => {
          const target = phaseEntryStep(steps, phase, RAIL_IDS);
          if (target) onNavigate(target);
        }}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          {repositoryAlert}
          <section className="rounded-2xl border border-steel bg-panel p-6 shadow-md">
            <WorkflowSteps
              label="Deployment workflow"
              steps={railSteps}
              panels={panels}
              initialIndex={initialIndex}
              navigation={navigation}
              onActiveChange={onActiveChange}
              phaseOf={PHASE_OF_STEP}
            progress={{
              complete: steps.filter((step) => step.state === "complete").length,
              total: steps.length,
            }}
            />
          </section>
        </div>
        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-label-sm uppercase text-cinder">Step 01 · GitHub repository</p>
            {repositoryPanel}
          </div>
          <WorkflowChecklist
            steps={steps}
            activeId={activeId}
            selectableIds={RAIL_IDS}
            onSelect={onNavigate}
          />
        </aside>
      </div>
    </div>
  );
}
