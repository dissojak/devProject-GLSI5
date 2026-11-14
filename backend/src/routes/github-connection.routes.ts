import { Router } from 'express';
import type { RequestHandler } from 'express';

import {
  createDisconnectGithubController,
  createGithubConnectionCallbackController,
  createGithubConnectionStatusController,
  createListGithubRepositoriesController,
  createStartGithubConnectionController,
} from '../controllers/github-connection.controller.js';
import type { GithubConnectionService } from '../services/github-connection/github-connection.service.js';

export function createGithubConnectionRouter(
  connections: GithubConnectionService,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.get('/connection', requireAuth, createGithubConnectionStatusController(connections));
  router.post('/connection', requireAuth, createStartGithubConnectionController(connections));
  router.delete('/connection', requireAuth, createDisconnectGithubController(connections));
  router.get('/repositories', requireAuth, createListGithubRepositoriesController(connections));

  return router;
}

/** Mounted under /auth: the GitHub callback must sit below the registered OAuth callback URL. */
export function createGithubConnectionCallbackRouter(
  connections: GithubConnectionService,
  frontendUrl: string,
): Router {
  const router = Router();

  router.get(
    '/github/callback/repositories',
    createGithubConnectionCallbackController(connections, frontendUrl),
  );

  return router;
}
