import { Types } from 'mongoose';

import {
  ConflictError,
  NotFoundError,
} from '../../domain/errors/index.js';
import { DEPLOYMENT_MANIFESTS_PATH } from '../../domain/enums/deployment.enums.js';
import {
  PLAN_COMPONENT_DEFAULT_PORTS,
  PLAN_COMPONENT_DEFAULT_REPLICAS,
} from '../../domain/enums/plan.enums.js';
import type { ProjectEnvironment } from '../../domain/enums/project.enums.js';
import { buildGitHubUrl } from '../../domain/value-objects/repository-url.js';
import type {
  AnalysisDocument,
  DeploymentPlanDocument,
  PlanComponent,
  ProjectDocument,
} from '../../models/entities/index.js';
import type { PlanRepository } from '../../repositories/plan.repository.js';
import type { ProjectRepository } from '../../repositories/project.repository.js';
import type { DeploymentRepository } from '../../repositories/deployment.repository.js';
import type { AuditLogRepository } from '../../repositories/audit-log.repository.js';
import type { AnalysisRepository } from '../../repositories/analysis.repository.js';
import type { RecommendationRepository } from '../../repositories/recommendation.repository.js';
import type { DeploymentTrigger } from '../deployments/n8n-deployment-trigger.js';
import type { ListPlansQuery, RejectPlanBody } from './plan.schema.js';

export interface PlanListResult {
  items: DeploymentPlanDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
}

const entityOf = (plan: DeploymentPlanDocument) => ({
  type: 'DeploymentPlan',
  id: plan._id,
});

/** Draft v1 resource baseline (requests < limits) before any review tuning. */
const DRAFT_RESOURCES = {
  requests: { cpu: '100m', memory: '128Mi' },
  limits: { cpu: '500m', memory: '512Mi' },
} as const;

/** Maps an analyzed component to its plan counterpart (deterministic). */
const componentOf = (analyzed: AnalysisDocument['components'][number]): PlanComponent => ({
  name: analyzed.name,
  type: analyzed.type,
  containerPort: PLAN_COMPONENT_DEFAULT_PORTS[analyzed.type],
  replicas: PLAN_COMPONENT_DEFAULT_REPLICAS,
  resources: { requests: { ...DRAFT_RESOURCES.requests }, limits: { ...DRAFT_RESOURCES.limits } },
  hpa: { enabled: false },
  ingress: { enabled: false, tls: false },
});

export type PlanService = ReturnType<typeof createPlanService>;

export function createPlanService(
  plans: PlanRepository,
  projects: ProjectRepository,
  deployments: DeploymentRepository,
  audit: AuditLogRepository,
  analyses: AnalysisRepository,
  recommendations: RecommendationRepository,
  workflow: DeploymentTrigger,
) {
  async function findOwnedPlan(
    userId: string,
    planId: string,
  ): Promise<DeploymentPlanDocument> {
    const plan = await plans.findById(planId);

    if (!plan) {
      throw new NotFoundError('Deployment plan not found');
    }

    const project = await projects.findByIdForOwner(String(plan.project), userId);

    if (!project) {
      throw new NotFoundError('Deployment plan not found');
    }

    return plan;
  }

  async function list(
    userId: string,
    query: ListPlansQuery,
  ): Promise<PlanListResult> {
    const owned = await projects.findByOwner(userId);
    const projectIds = owned.map((project) => project._id);

    if (projectIds.length === 0) {
      return {
        items: [],
        pagination: {
          page: query.page,
          limit: query.limit,
          total: 0,
          pageCount: 0,
        },
      };
    }

    const { items, total, page, limit, pageCount } = await plans.paginate(
      { project: { $in: projectIds } },
      { page: query.page, limit: query.limit, sort: { createdAt: -1 } },
    );

    return { items, pagination: { page, limit, total, pageCount } };
  }

  async function get(userId: string, planId: string): Promise<DeploymentPlanDocument> {
    return findOwnedPlan(userId, planId);
  }

  async function approve(
    userId: string,
    planId: string,
  ): Promise<DeploymentPlanDocument> {
    const plan = await findOwnedPlan(userId, planId);
    const approved = await plan.approve(new Types.ObjectId(userId));

    await audit.record({
      actor: new Types.ObjectId(userId),
      action: 'PLAN_APPROVED',
      entity: entityOf(approved),
      metadata: { projectId: String(approved.project), version: approved.version },
    });

    return approved;
  }

  async function reject(
    userId: string,
    planId: string,
    body: RejectPlanBody,
  ): Promise<DeploymentPlanDocument> {
    const plan = await findOwnedPlan(userId, planId);
    const rejected = await plan.reject(new Types.ObjectId(userId), body.reason);

    await audit.record({
      actor: new Types.ObjectId(userId),
      action: 'PLAN_REJECTED',
      entity: entityOf(rejected),
      metadata: {
        projectId: String(rejected.project),
        version: rejected.version,
        reason: rejected.review?.reason,
      },
    });

    return rejected;
  }

  /** Mints the next DRAFT revision from an APPROVED/REJECTED plan (new document).
   * APPROVED sources are superseded after the revision is minted — the
   * supersede+revision pairing is this service's responsibility
   * (docs/domain-model.md). */
  async function revise(
    userId: string,
    planId: string,
  ): Promise<DeploymentPlanDocument> {
    const source = await findOwnedPlan(userId, planId);
    const actor = new Types.ObjectId(userId);
    const revision = source.createRevision(actor);

    if (source.status === 'APPROVED') {
      await source.supersede();
    }

    const saved = await plans.save(revision);

    await audit.record({
      actor,
      action: 'PLAN_CREATED',
      entity: entityOf(saved),
      metadata: {
        projectId: String(saved.project),
        version: saved.version,
        revisesVersion: source.version,
      },
    });

    return saved;
  }

  /**
   * Mints plan v1 (or the next version) as a DRAFT from a COMPLETED analysis
   * of one of the user's projects. Components map 1:1 from the analysis with
   * deterministic defaults; accepted recommendations travel with the plan so
   * reviewers see what the draft is based on (docs/domain-model.md).
   */
  async function draft(
    userId: string,
    projectId: string,
    analysisId: string,
  ): Promise<DeploymentPlanDocument> {
    const project = await projects.findByIdForOwner(projectId, userId);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const analysis = await analyses.findById(analysisId);

    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    if (String(analysis.project) !== projectId) {
      throw new NotFoundError('Analysis not found');
    }

    if (analysis.status !== 'COMPLETED') {
      throw new ConflictError('Only a completed analysis can produce a plan draft');
    }

    const accepted = (await recommendations.listByAnalysis(analysis._id)).filter(
      (recommendation) => recommendation.status === 'ACCEPTED',
    );
    const version = await plans.nextVersionFor(project._id);
    const saved = await plans.draft({
      projectId: project._id,
      analysisId: analysis._id,
      createdBy: new Types.ObjectId(userId),
      version,
      components: analysis.components.map(componentOf),
      recommendations: accepted.map((recommendation) => recommendation._id),
    });

    await audit.record({
      actor: new Types.ObjectId(userId),
      action: 'PLAN_CREATED',
      entity: entityOf(saved),
      metadata: {
        projectId: String(saved.project),
        version: saved.version,
        analysisId: String(analysis._id),
      },
    });

    return saved;
  }

  async function deploy(
    userId: string,
    planId: string,
    environment: ProjectEnvironment,
  ) {
    const plan = await findOwnedPlan(userId, planId);
    const project: ProjectDocument | null = await projects.findByIdForOwner(
      String(plan.project),
      userId,
    );

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const { repository } = project;

    if (!repository) {
      throw new NotFoundError('Project has no connected repository');
    }

    const deployment = await deployments.createFromPlan({
      plan,
      user: new Types.ObjectId(userId),
      environment,
      gitops: {
        repositoryUrl: buildGitHubUrl(repository.owner, repository.name),
        branch: repository.branch,
        path: DEPLOYMENT_MANIFESTS_PATH,
      },
    });

    await audit.record({
      actor: new Types.ObjectId(userId),
      action: 'DEPLOYMENT_REQUESTED',
      entity: { type: 'Deployment', id: deployment._id },
      metadata: {
        projectId: String(deployment.project),
        planId: String(deployment.plan),
        planVersion: deployment.planVersion,
        environment: deployment.environment,
      },
    });

    try {
      await workflow.trigger({
        deploymentId: String(deployment._id),
        planId: String(plan._id),
        gitops: {
          repositoryUrl: buildGitHubUrl(repository.owner, repository.name),
          branch: repository.branch,
          path: DEPLOYMENT_MANIFESTS_PATH,
        },
      });
    } catch (error) {
      // The trigger failed after the record exists: cancel the PENDING
      // deployment (the machine's only exit from PENDING besides progress)
      // instead of leaving a phantom PENDING row.
      const cancelled = await deployment.cancel();

      const message =
        error instanceof Error ? error.message : 'Deployment workflow could not be started';

      await audit.record({
        actor: new Types.ObjectId(userId),
        action: 'DEPLOYMENT_FAILED',
        level: 'ERROR',
        entity: { type: 'Deployment', id: cancelled._id },
        message,
        metadata: { code: 'WORKFLOW_TRIGGER_FAILED' },
      });
      throw error;
    }

    return deployment;
  }

  return { list, get, approve, reject, revise, draft, deploy };
}
