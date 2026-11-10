import { Router, type RequestHandler } from 'express';

import { createListAllAnalysesHandler } from '../controllers/analysis.controller.js';
import type { AnalysisService } from '../services/analysis/analysis.service.js';

/** Cross-project analyses board (GET /analyses), scoped to the requesting user. */
export function createAnalysisGlobalRouter(
  analysisService: AnalysisService,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.get('/', requireAuth, createListAllAnalysesHandler(analysisService));

  return router;
}
