import { Router, type RequestHandler } from 'express';

import {
  createApprovePlanHandler,
  createDeployPlanHandler,
  createDraftPlanHandler,
  createGetPlanHandler,
  createListPlansHandler,
  createRejectPlanHandler,
  createRevisePlanHandler,
} from '../controllers/plan.controller.js';
import type { PlanService } from '../services/plans/plan.service.js';

export function createPlanRouter(
  planService: PlanService,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.get('/', requireAuth, createListPlansHandler(planService));
  router.get('/:planId', requireAuth, createGetPlanHandler(planService));
  router.post('/', requireAuth, createDraftPlanHandler(planService));
  router.post('/:planId/approve', requireAuth, createApprovePlanHandler(planService));
  router.post('/:planId/reject', requireAuth, createRejectPlanHandler(planService));
  router.post('/:planId/revisions', requireAuth, createRevisePlanHandler(planService));
  router.post('/:planId/deployments', requireAuth, createDeployPlanHandler(planService));

  return router;
}
