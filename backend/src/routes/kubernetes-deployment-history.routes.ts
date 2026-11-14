
import {
  Router,
  type RequestHandler,
} from 'express';

import type {
  KubernetesDeploymentHistoryService,
} from '../services/kubernetes-deployment-history/kubernetes-deployment-history.service.js';

import {
  listKubernetesDeploymentHistoryHandler,
} from '../controllers/kubernetes-deployment-history.controller.js';

export function createKubernetesDeploymentHistoryRouter(
  service: KubernetesDeploymentHistoryService,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.get(
    '/:projectId/plans/:planId/deployments/history',
    requireAuth,
    listKubernetesDeploymentHistoryHandler(service),
  );

  return router;
}
