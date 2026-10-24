import { Router } from 'express';

import { getEnv } from '../config/env.js';

// Feature wiring
import { createAuthRouter } from './auth.routes.js';
import { createGithubAuthRouter } from './github-auth.routes.js';
import { createProjectRouter } from './project.routes.js';

// Guards
import { createRequireAuth } from '../middleware/require-auth.js';

// Repositories: built HERE, only here
import { UserRepository } from '../repositories/user.repository.js';
import { AuthIdentityRepository } from '../repositories/auth-identity.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';

// Services (functional factories; deps default-wire themselves)
import { createAuthService } from '../services/auth/auth.service.js';
import { createGithubAuthService } from '../services/auth/github-auth.service.js';
import { createGithubOAuthService } from '../services/auth/github-oauth.service.js';
import { createSessionTokenService } from '../services/auth/session-token.service.js';
import { createProjectService } from '../services/project/project.service.js';

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
  const projects = new ProjectRepository();

  const sessionTokens = createSessionTokenService(env.sessionSecret);
  const authService = createAuthService(users);
  const projectService = createProjectService(projects);

  const requireAuth = createRequireAuth({
    verifyToken: (token) => sessionTokens.verify(token),
    findUserById: (id) => users.findById(id, { withDeleted: true }),
  });

  const router = Router();

  router.use('/auth', createAuthRouter(authService));

  router.use('/auth', createGithubAuthRouter({
    oauth: createGithubOAuthService(
      env.githubClientId,
      env.githubClientSecret,
      env.githubCallbackUrl,
    ),
    auth: createGithubAuthService(users, identities),
    sessions: sessionTokens,
    frontendUrl: env.frontendUrl,
    secureCookies: env.nodeEnv === 'production',
  }));

  router.use('/projects', createProjectRouter(projectService, requireAuth));

  return router;
}