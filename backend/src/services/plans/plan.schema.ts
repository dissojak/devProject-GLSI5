import { z } from 'zod';

import { hexIdSchema } from '../../shared/validation/request-validation.js';
import { PROJECT_ENVIRONMENTS } from '../../domain/enums/project.enums.js';

export const listPlansQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const planParamsSchema = z.strictObject({
  planId: hexIdSchema,
});

export const rejectPlanBodySchema = z.strictObject({
  reason: z.string().trim().min(1),
});

export const deployPlanBodySchema = z.strictObject({
  environment: z.enum(PROJECT_ENVIRONMENTS),
});

export type ListPlansQuery = z.infer<typeof listPlansQuerySchema>;
export type RejectPlanBody = z.infer<typeof rejectPlanBodySchema>;
export type DeployPlanBody = z.infer<typeof deployPlanBodySchema>;
