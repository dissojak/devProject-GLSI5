import { Router } from 'express';

import type { AuthService } from '../services/auth/auth.service.js';
import {
  createRegisterController,
  createLoginController,
} from '../controllers/auth.controller.js';

/**
 * HTTP wiring ONLY: paths + controllers created ON the route line.
 * Services arrive injected from routes/index.ts (the composition root).
 */
export function createAuthRouter(authService: AuthService): Router {
  const router = Router();

  router.post('/register', createRegisterController(authService));

  router.post('/login', createLoginController(authService));

  return router;
}
