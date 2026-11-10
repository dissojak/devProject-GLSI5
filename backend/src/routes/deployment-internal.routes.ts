import { Router, type RequestHandler } from 'express';

import {
  createArgoStatusHandler,
  createFailDeploymentHandler,
  createGitopsCommitHandler,
  createStartDeploymentHandler,
  createSucceedDeploymentHandler,
} from '../controllers/deployment.controller.js';
import type { DeploymentService } from '../services/deployments/deployment.service.js';

/** n8n/Argo lifecycle webhooks for deployments (internal-secret guarded). */
export function createDeploymentInternalRouter(
  deploymentService: DeploymentService,
  requireInternalSecret: RequestHandler,
): Router {
  const router = Router();

  router.post(
    '/:deploymentId/start',
    requireInternalSecret,
    createStartDeploymentHandler(deploymentService),
  );
  router.post(
    '/:deploymentId/succeed',
    requireInternalSecret,
    createSucceedDeploymentHandler(deploymentService),
  );
  router.post(
    '/:deploymentId/fail',
    requireInternalSecret,
    createFailDeploymentHandler(deploymentService),
  );
  router.post(
    '/:deploymentId/gitops-commit',
    requireInternalSecret,
    createGitopsCommitHandler(deploymentService),
  );
  router.post(
    '/:deploymentId/argo-status',
    requireInternalSecret,
    createArgoStatusHandler(deploymentService),
  );

  return router;
}
