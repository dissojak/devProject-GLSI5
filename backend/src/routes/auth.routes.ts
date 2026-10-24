
import { Router } from 'express';

import type { AuthService } from '../services/auth/auth.service.js';
import type {
  SessionTokenService,
} from '../types/index.js';

import {
  createRegisterController,
  createLoginController,
} from '../controllers/auth.controller.js';

export function createAuthRouter(
  authService: AuthService,
  sessions: SessionTokenService,
): Router {
  const router = Router();

  router.post(
    '/register',
    createRegisterController(authService),
  );

  router.post(
    '/login',
    createLoginController(authService, sessions),
  );

  return router;
}
