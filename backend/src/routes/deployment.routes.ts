import { Router, type RequestHandler } from 'express';

import {
  createCancelDeploymentHandler,
  createGetDeploymentHandler,
  createListDeploymentsHandler,
} from '../controllers/deployment.controller.js';
import type { DeploymentService } from '../services/deployments/deployment.service.js';

export function createDeploymentRouter(
  deploymentService: DeploymentService,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.get('/', requireAuth, createListDeploymentsHandler(deploymentService));
  router.get(
    '/:deploymentId',
    requireAuth,
    createGetDeploymentHandler(deploymentService),
  );
  router.post(
    '/:deploymentId/cancel',
    requireAuth,
    createCancelDeploymentHandler(deploymentService),
  );

  return router;
}
