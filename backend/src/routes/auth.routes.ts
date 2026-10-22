import { Router, type RequestHandler } from 'express';

export function createAuthRouter(
  registerController: RequestHandler,
  loginController: RequestHandler,
): Router {
  const router = Router();

  router.post(
    '/register',
    registerController,
  );

  router.post(
    '/login',
    loginController,
  );

  return router;
}