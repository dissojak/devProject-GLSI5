
import type {
  RequestHandler,
} from 'express';

import { z } from 'zod';

import {
  parseOrThrow,
} from '../shared/validation/request-validation.js';

import {
  manifestParamsSchema,
} from '../services/kubernetes-manifests/kubernetes-manifest.schema.js';

import type {
  KubernetesDeploymentHistoryService,
} from '../services/kubernetes-deployment-history/kubernetes-deployment-history.service.js';

const querySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export function listKubernetesDeploymentHistoryHandler(
  service: KubernetesDeploymentHistoryService,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { projectId, planId } = parseOrThrow(
        manifestParamsSchema,
        req.params,
        'Invalid deployment history parameters',
      );

      const pagination = parseOrThrow(
        querySchema,
        req.query,
        'Invalid deployment history pagination',
      );

      const result = await service.list(
        res.locals.userId as string,
        projectId,
        planId,
        pagination,
      );

      res.setHeader('Cache-Control', 'no-store');

      res.status(200).json({
        message: 'Kubernetes deployment history retrieved',
        data: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pageCount: result.pageCount,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
