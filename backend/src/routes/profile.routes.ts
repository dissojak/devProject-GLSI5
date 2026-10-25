import { Router, type RequestHandler } from 'express';

import type { ProfileService } from '../services/profile/profile.service.js';

import {
  createGetProfileController,
  createUpdateProfileController,
  createChangePasswordController,
} from '../controllers/profile.controller.js';

export function createProfileRouter(
  profileService: ProfileService,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.get(
    '/profile',
    requireAuth,
    createGetProfileController(profileService),
  );

  router.patch(
    '/profile',
    requireAuth,
    createUpdateProfileController(profileService),
  );

  router.post(
    '/profile/password',
    requireAuth,
    createChangePasswordController(profileService),
  );

  return router;
}