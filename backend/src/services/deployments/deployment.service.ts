import { Types } from 'mongoose';

import { NotFoundError } from '../../domain/errors/index.js';
import type { DeploymentDocument } from '../../models/entities/index.js';
import type { DeploymentRepository } from '../../repositories/deployment.repository.js';
import type { ProjectRepository } from '../../repositories/project.repository.js';
import type { AuditLogRepository } from '../../repositories/audit-log.repository.js';
import type {
  ArgoStatusBody,
  FailDeploymentBody,
  ListDeploymentsQuery,
} from './deployment.schema.js';

export interface DeploymentListResult {
  items: DeploymentDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
}

const entityOf = (deployment: DeploymentDocument) => ({
  type: 'Deployment',
  id: deployment._id,
});

export type DeploymentService = ReturnType<typeof createDeploymentService>;

export function createDeploymentService(
  deployments: DeploymentRepository,
  projects: ProjectRepository,
  audit: AuditLogRepository,
) {
  async function findOwnedDeployment(
    userId: string,
    deploymentId: string,
  ): Promise<DeploymentDocument> {
    const deployment = await deployments.findById(deploymentId);

    if (!deployment) {
      throw new NotFoundError('Deployment not found');
    }

    const project = await projects.findByIdForOwner(String(deployment.project), userId);

    if (!project) {
      throw new NotFoundError('Deployment not found');
    }

    return deployment;
  }

  async function findForWorkflow(deploymentId: string): Promise<DeploymentDocument> {
    const deployment = await deployments.findById(deploymentId);

    if (!deployment) {
      throw new NotFoundError('Deployment not found');
    }

    return deployment;
  }

  async function list(
    userId: string,
    query: ListDeploymentsQuery,
  ): Promise<DeploymentListResult> {
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

    const { items, total, page, limit, pageCount } = await deployments.paginate(
      { project: { $in: projectIds } },
      { page: query.page, limit: query.limit, sort: { createdAt: -1 } },
    );

    return { items, pagination: { page, limit, total, pageCount } };
  }

  async function get(userId: string, deploymentId: string): Promise<DeploymentDocument> {
    return findOwnedDeployment(userId, deploymentId);
  }

  async function cancel(userId: string, deploymentId: string): Promise<DeploymentDocument> {
    const deployment = await findOwnedDeployment(userId, deploymentId);
    const cancelled = await deployment.cancel();

    await audit.record({
      actor: new Types.ObjectId(userId),
      action: 'DEPLOYMENT_CANCELLED',
      entity: entityOf(cancelled),
      metadata: { projectId: String(cancelled.project), environment: cancelled.environment },
    });

    return cancelled;
  }

  async function start(deploymentId: string): Promise<DeploymentDocument> {
    const deployment = await findForWorkflow(deploymentId);
    const started = await deployment.start();

    await audit.record({
      action: 'DEPLOYMENT_STARTED',
      entity: entityOf(started),
      metadata: { projectId: String(started.project), environment: started.environment },
    });

    return started;
  }

  async function succeed(deploymentId: string): Promise<DeploymentDocument> {
    const deployment = await findForWorkflow(deploymentId);
    const succeeded = await deployment.markSucceeded();

    await audit.record({
      action: 'DEPLOYMENT_SUCCEEDED',
      entity: entityOf(succeeded),
      metadata: { projectId: String(succeeded.project), environment: succeeded.environment },
    });

    return succeeded;
  }

  async function fail(
    deploymentId: string,
    error: FailDeploymentBody,
  ): Promise<DeploymentDocument> {
    const deployment = await findForWorkflow(deploymentId);
    const failed = await deployment.markFailed(error);

    await audit.record({
      action: 'DEPLOYMENT_FAILED',
      level: 'ERROR',
      entity: entityOf(failed),
      message: error.message,
      metadata: { projectId: String(failed.project), code: error.code },
    });

    return failed;
  }

  async function recordGitopsCommit(
    deploymentId: string,
    commitSha: string,
  ): Promise<DeploymentDocument> {
    const deployment = await findForWorkflow(deploymentId);

    return deployment.recordGitopsCommit(commitSha);
  }

  async function recordArgoStatus(
    deploymentId: string,
    status: ArgoStatusBody,
  ): Promise<DeploymentDocument> {
    const deployment = await findForWorkflow(deploymentId);

    return deployment.recordArgoStatus(status);
  }

  return { list, get, cancel, start, succeed, fail, recordGitopsCommit, recordArgoStatus };
}
