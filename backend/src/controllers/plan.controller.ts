import type { RequestHandler } from 'express';

import { parseOrThrow } from '../shared/validation/request-validation.js';
import {
  deployPlanBodySchema,
  listPlansQuerySchema,
  planParamsSchema,
  rejectPlanBodySchema,
} from '../services/plans/plan.schema.js';
import type { PlanService } from '../services/plans/plan.service.js';

export function createListPlansHandler(service: PlanService): RequestHandler {
  return async (req, res, next) => {
    try {
      const query = parseOrThrow(listPlansQuerySchema, req.query, 'Invalid query');
      const { items, pagination } = await service.list(res.locals.userId as string, query);

      res.json({ message: 'Deployment plans retrieved', data: items, pagination });
    } catch (error) {
      next(error);
    }
  };
}

export function createGetPlanHandler(service: PlanService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { planId } = parseOrThrow(planParamsSchema, req.params, 'Invalid plan id');
      const plan = await service.get(res.locals.userId as string, planId);

      res.json({ message: 'Deployment plan retrieved', data: plan });
    } catch (error) {
      next(error);
    }
  };
}

export function createApprovePlanHandler(service: PlanService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { planId } = parseOrThrow(planParamsSchema, req.params, 'Invalid plan id');
      const plan = await service.approve(res.locals.userId as string, planId);

      res.json({ message: 'Deployment plan approved', data: plan });
    } catch (error) {
      next(error);
    }
  };
}

export function createRejectPlanHandler(service: PlanService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { planId } = parseOrThrow(planParamsSchema, req.params, 'Invalid plan id');
      const body = parseOrThrow(rejectPlanBodySchema, req.body, 'Invalid rejection payload');
      const plan = await service.reject(res.locals.userId as string, planId, body);

      res.json({ message: 'Deployment plan rejected', data: plan });
    } catch (error) {
      next(error);
    }
  };
}

export function createRevisePlanHandler(service: PlanService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { planId } = parseOrThrow(planParamsSchema, req.params, 'Invalid plan id');
      const plan = await service.revise(res.locals.userId as string, planId);

      res.status(201).json({ message: 'Deployment plan revision created', data: plan });
    } catch (error) {
      next(error);
    }
  };
}

export function createDeployPlanHandler(service: PlanService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { planId } = parseOrThrow(planParamsSchema, req.params, 'Invalid plan id');
      const body = parseOrThrow(deployPlanBodySchema, req.body, 'Invalid deployment payload');
      const deployment = await service.deploy(
        res.locals.userId as string,
        planId,
        body.environment,
      );

      res.status(201).json({ message: 'Deployment requested', data: deployment });
    } catch (error) {
      next(error);
    }
  };
}
