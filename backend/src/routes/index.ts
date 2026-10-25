import { Router } from 'express';

import { getEnv } from '../config/env.js';

// Feature routers
import { createAuthRouter } from './auth.routes.js';
import { createGithubAuthRouter } from './github-auth.routes.js';
import { createProjectRouter } from './project.routes.js';
import { createUsersRouter } from './users.routes.js';
import { createUserApprovalRouter } from './user-approval.routes.js';
import { createProfileRouter } from './profile.routes.js';
// Middleware factories
import { createRequireAuth } from '../middleware/require-auth.js';

// Repositories
import { UserRepository } from '../repositories/user.repository.js';
import { AuthIdentityRepository } from '../repositories/auth-identity.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';

// Functional service factories
import { createAuthService } from '../services/auth/auth.service.js';
import { createGithubAuthService } from '../services/auth/github-auth.service.js';
import { createGithubOAuthService } from '../services/auth/github-oauth.service.js';
import { createSessionTokenService } from '../services/auth/session-token.service.js';
import { createProjectService } from '../services/project/project.service.js';
import { createUserService } from '../services/users/user.service.js';
import { createUserApprovalService } from '../services/users/user-approval.service.js';
import { createProfileService } from '../services/profile/profile.service.js';

/**
 * API composition root.
 *
 * Responsibilities:
 * - Load validated environment configuration.
 * - Instantiate repositories once.
 * - Build functional services.
 * - Inject dependencies into feature routers.
 *
 * No business logic or database queries.
 */
export function createApiRouter(): Router {
  const env = getEnv();

  // Repositories
  const users = new UserRepository();
  const identities = new AuthIdentityRepository();
  const projects = new ProjectRepository();

  // Shared services
  const sessions = createSessionTokenService(env.sessionSecret);
  const authService = createAuthService(users);
  const userService = createUserService(users);
  const approvalService = createUserApprovalService(users);
  const projectService = createProjectService(projects);
  const profileService = createProfileService(users);
  const githubOAuthService = createGithubOAuthService(
    env.githubClientId,
    env.githubClientSecret,
    env.githubCallbackUrl,
  );

  const githubAuthService = createGithubAuthService(
    users,
    identities,
  );

  // Authentication middleware
  const requireAuth = createRequireAuth(
    sessions,
    userService,
  );

  // Main API router
  const router = Router();

  // Email/password authentication
  router.use(
    '/auth',
    createAuthRouter(authService, sessions, requireAuth),
  );

  // GitHub OAuth authentication
  router.use(
    '/auth',
    createGithubAuthRouter({
      oauth: githubOAuthService,
      auth: githubAuthService,
      sessions,
      frontendUrl: env.frontendUrl,
      secureCookies: env.nodeEnv === 'production',
    }),
  );

  // Administrator user approval - MUST mount before the generic
  // /admin/users routes, otherwise GET /users/pending is swallowed by
  // GET /users/:id (id="pending" -> 400) - see docs/conventions.md.
  router.use(
    '/admin',
    createUserApprovalRouter(approvalService, requireAuth),
  );

  // Administrator user management
  router.use(
    '/admin',
    createUsersRouter(userService, requireAuth),
  );

  // User project management
  router.use('/projects', createProjectRouter(projectService, requireAuth));

  // Self-scoped profile (self-vs-admin read: mounted at /profile)
  router.use('/profile', createProfileRouter(profileService, requireAuth));

  return router;
}
