import { Router, type RequestHandler } from 'express';

export function createGithubAuthRouter(
  start: RequestHandler,
  callback: RequestHandler,
): Router {
  const router = Router();

  router.get('/github', start);

  router.get('/github/callback', callback);

  return router;
}