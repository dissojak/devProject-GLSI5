
import { Types } from 'mongoose';

import {
  ConflictError,
  NotFoundError,
} from '../../domain/errors/index.js';

import {
  ProjectRepository,
} from '../../repositories/project.repository.js';

import {
  PlanRepository,
} from '../../repositories/plan.repository.js';

import {
  KubernetesDeploymentAttemptRepository,
} from '../../repositories/kubernetes-deployment-attempt.repository.js';

export interface KubernetesHistoryTarget {
  cluster: string;
  namespace: string;
}

export interface HistoryPagination {
  page: number;
  limit: number;
}

export function createKubernetesDeploymentHistoryService(
  target: KubernetesHistoryTarget,
  attempts = new KubernetesDeploymentAttemptRepository(),
  projects = new ProjectRepository(),
  plans = new PlanRepository(),
) {
  async function requirePlan(
    userId: string,
    projectId: string,
    planId: string,
  ) {
    const project = await projects.findByIdForOwner(
      projectId,
      userId,
    );

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const plan = await plans.findOne({
      _id: planId,
      project: projectId,
    });

    if (!plan) {
      throw new NotFoundError(
        'Deployment plan not found',
      );
    }

    return plan;
  }

  async function begin(
    userId: string,
    projectId: string,
    planId: string,
  ) {
    const plan = await requirePlan(
      userId,
      projectId,
      planId,
    );

    if (plan.status !== 'APPROVED') {
      throw new ConflictError(
        'An approved deployment plan is required',
      );
    }

    return attempts.create({
      project: new Types.ObjectId(projectId),
      plan: new Types.ObjectId(planId),
      planVersion: plan.version,
      triggeredBy: new Types.ObjectId(userId),
      cluster: target.cluster,
      namespace: target.namespace,
      status: 'STARTED',
      startedAt: new Date(),
    });
  }

  async function markApplied(
    attemptId: string,
    output: string,
  ) {
    const attempt = await attempts.findById(
      attemptId,
    );

    if (!attempt) {
      throw new NotFoundError(
        'Deployment attempt not found',
      );
    }

    return attempt.markApplied(output);
  }

  async function markFailed(
    attemptId: string,
    message: string,
  ) {
    const attempt = await attempts.findById(
      attemptId,
    );

    if (!attempt) {
      throw new NotFoundError(
        'Deployment attempt not found',
      );
    }

    return attempt.markFailed(message);
  }

  async function list(
    userId: string,
    projectId: string,
    planId: string,
    pagination: HistoryPagination,
  ) {
    await requirePlan(
      userId,
      projectId,
      planId,
    );

    return attempts.listByPlan(
      projectId,
      planId,
      pagination.page,
      pagination.limit,
    );
  }

  return {
    begin,
    markApplied,
    markFailed,
    list,
  };
}

export type KubernetesDeploymentHistoryService =
  ReturnType<typeof createKubernetesDeploymentHistoryService>;
