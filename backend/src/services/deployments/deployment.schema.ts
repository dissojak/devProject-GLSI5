import { z } from 'zod';

import { hexIdSchema } from '../../shared/validation/request-validation.js';
import { ARGO_HEALTH_STATUSES, ARGO_SYNC_STATUSES } from '../../domain/enums/deployment.enums.js';

export const listDeploymentsQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const deploymentParamsSchema = z.strictObject({
  deploymentId: hexIdSchema,
});

export const failDeploymentBodySchema = z.strictObject({
  code: z.string().trim().min(1).max(100),
  message: z.string().trim().min(1).max(1000),
});

export const gitopsCommitBodySchema = z.strictObject({
  commitSha: z.string().trim().min(1).max(64),
});

export const argoStatusBodySchema = z.strictObject({
  applicationName: z.string().trim().min(1).optional(),
  syncStatus: z.enum(ARGO_SYNC_STATUSES).optional(),
  healthStatus: z.enum(ARGO_HEALTH_STATUSES).optional(),
  lastSyncedAt: z.coerce.date().optional(),
});

export type ListDeploymentsQuery = z.infer<typeof listDeploymentsQuerySchema>;
export type FailDeploymentBody = z.infer<typeof failDeploymentBodySchema>;
export type ArgoStatusBody = z.infer<typeof argoStatusBodySchema>;
