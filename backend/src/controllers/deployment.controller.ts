import type { RequestHandler } from 'express';

import { parseOrThrow } from '../shared/validation/request-validation.js';
import {
  argoStatusBodySchema,
  deploymentParamsSchema,
  failDeploymentBodySchema,
  gitopsCommitBodySchema,
  listDeploymentsQuerySchema,
} from '../services/deployments/deployment.schema.js';
import type { DeploymentService } from '../services/deployments/deployment.service.js';

export function createListDeploymentsHandler(service: DeploymentService): RequestHandler {
  return async (req, res, next) => {
    try {
      const query = parseOrThrow(listDeploymentsQuerySchema, req.query, 'Invalid query');
      const { items, pagination } = await service.list(res.locals.userId as string, query);

      res.json({ message: 'Deployments retrieved', data: items, pagination });
    } catch (error) {
      next(error);
    }
  };
}

export function createGetDeploymentHandler(service: DeploymentService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { deploymentId } = parseOrThrow(
        deploymentParamsSchema,
        req.params,
        'Invalid deployment id',
      );
      const deployment = await service.get(res.locals.userId as string, deploymentId);

      res.json({ message: 'Deployment retrieved', data: deployment });
    } catch (error) {
      next(error);
    }
  };
}

export function createCancelDeploymentHandler(service: DeploymentService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { deploymentId } = parseOrThrow(
        deploymentParamsSchema,
        req.params,
        'Invalid deployment id',
      );
      const deployment = await service.cancel(res.locals.userId as string, deploymentId);

      res.json({ message: 'Deployment cancelled', data: deployment });
    } catch (error) {
      next(error);
    }
  };
}

export function createStartDeploymentHandler(service: DeploymentService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { deploymentId } = parseOrThrow(
        deploymentParamsSchema,
        req.params,
        'Invalid deployment id',
      );
      const deployment = await service.start(deploymentId);

      res.json({ message: 'Deployment started', data: deployment });
    } catch (error) {
      next(error);
    }
  };
}

export function createSucceedDeploymentHandler(service: DeploymentService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { deploymentId } = parseOrThrow(
        deploymentParamsSchema,
        req.params,
        'Invalid deployment id',
      );
      const deployment = await service.succeed(deploymentId);

      res.json({ message: 'Deployment succeeded', data: deployment });
    } catch (error) {
      next(error);
    }
  };
}

export function createFailDeploymentHandler(service: DeploymentService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { deploymentId } = parseOrThrow(
        deploymentParamsSchema,
        req.params,
        'Invalid deployment id',
      );
      const body = parseOrThrow(failDeploymentBodySchema, req.body, 'Invalid error payload');
      const deployment = await service.fail(deploymentId, body);

      res.json({ message: 'Deployment failed', data: deployment });
    } catch (error) {
      next(error);
    }
  };
}

export function createGitopsCommitHandler(service: DeploymentService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { deploymentId } = parseOrThrow(
        deploymentParamsSchema,
        req.params,
        'Invalid deployment id',
      );
      const body = parseOrThrow(gitopsCommitBodySchema, req.body, 'Invalid commit payload');
      const deployment = await service.recordGitopsCommit(deploymentId, body.commitSha);

      res.json({ message: 'Gitops commit recorded', data: deployment });
    } catch (error) {
      next(error);
    }
  };
}

export function createArgoStatusHandler(service: DeploymentService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { deploymentId } = parseOrThrow(
        deploymentParamsSchema,
        req.params,
        'Invalid deployment id',
      );
      const body = parseOrThrow(argoStatusBodySchema, req.body, 'Invalid argo payload');
      const deployment = await service.recordArgoStatus(deploymentId, body);

      res.json({ message: 'Argo status recorded', data: deployment });
    } catch (error) {
      next(error);
    }
  };
}
