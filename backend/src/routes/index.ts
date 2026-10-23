import { Router } from 'express';

import { getEnv } from '../config/env.js';

// Feature wiring
import { createAuthRouter } from './auth.routes.js';
import { createGithubAuthRouter } from './github-auth.routes.js';

// Repositories: built HERE, only here
import { UserRepository } from '../repositories/user.repository.js';
import { AuthIdentityRepository } from '../repositories/auth-identity.repository.js';

// Services (functional factories; deps default-wire themselves)
import { createAuthService } from '../services/auth/auth.service.js';
import { createGithubAuthService } from '../services/auth/github-auth.service.js';
import { createGithubOAuthService } from '../services/auth/github-oauth.service.js';
import { createSessionTokenService } from '../services/auth/session-token.service.js';

/**
 * THE composition root of the application (see docs/conventions.md,
 * "Composition"):
 *
 * - the ONLY file allowed to build repositories and read `getEnv()` outside
 *   app.ts/server.ts;
 * - every feature router receives its dependencies from here exactly once,
 *   so each `createXxxService()` call is visible in a single place;
 * - feature route files below never build anything: they only declare paths
 *   and call controller factories on the route line.
 */
export function createApiRouter(): Router {
  const env = getEnv();

  // Every repository in the app is built HERE, and only here.
  const users = new UserRepository();
  const identities = new AuthIdentityRepository();

  const authService = createAuthService(users);

  const router = Router();

  router.use('/auth', createAuthRouter(authService));

  router.use('/auth', createGithubAuthRouter({
    oauth: createGithubOAuthService(
      env.githubClientId,
      env.githubClientSecret,
      env.githubCallbackUrl,
    ),
    auth: createGithubAuthService(users, identities),
    sessions: createSessionTokenService(env.sessionSecret),
    frontendUrl: env.frontendUrl,
    secureCookies: env.nodeEnv === 'production',
  }));

  return router;
}
