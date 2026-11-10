import { Router } from 'express';

import { getEnv } from '../config/env.js';

// Feature routers
import { createAuthRouter } from './auth.routes.js';
import { createGithubAuthRouter } from './github-auth.routes.js';
import { createProjectRouter } from './project.routes.js';
import { createRepositoryLinkRouter } from './repository-link.routes.js';
import { createRecommendationRouter } from './recommendation.routes.js';
import { createRecommendationInternalRouter } from './recommendation-internal.routes.js';
import { createAiAuditRouter } from './ai-audit.routes.js';
import { createAiAuditInternalRouter } from './ai-audit-internal.routes.js';
import { createAnalysisInternalRouter } from './analysis-internal.routes.js';
import { createAnalysisGlobalRouter } from './analysis-global.routes.js';
import { createPlanRouter } from './plan.routes.js';
import { createDeploymentRouter } from './deployment.routes.js';
import { createDeploymentInternalRouter } from './deployment-internal.routes.js';
import { createUsersRouter } from './users.routes.js';
import { createUserApprovalRouter } from './user-approval.routes.js';
import { createProfileRouter } from './profile.routes.js';
// Middleware factories
import { createRequireAuth } from '../middleware/require-auth.js';
import { createRequireInternalSecret } from '../middleware/require-internal.secret.js';

// Repositories
import { UserRepository } from '../repositories/user.repository.js';
import { AuthIdentityRepository } from '../repositories/auth-identity.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { AnalysisRepository } from '../repositories/analysis.repository.js';
import { RecommendationRepository } from '../repositories/recommendation.repository.js';
import { PlanRepository } from '../repositories/plan.repository.js';
import { DeploymentRepository } from '../repositories/deployment.repository.js';
import { AuditLogRepository } from '../repositories/audit-log.repository.js';

// Functional service factories
import { createAuthService } from '../services/auth/auth.service.js';
import { createGithubAuthService } from '../services/auth/github-auth.service.js';
import { createGithubOAuthService } from '../services/auth/github-oauth.service.js';
import { createSessionTokenService } from '../services/auth/session-token.service.js';
import { createProjectService } from '../services/project/project.service.js';
import { createRepositoryLinkService } from '../services/repository-link/repository-link.service.js';
import { createAnalysisService } from '../services/analysis/analysis.service.js';
import { createPlanService } from '../services/plans/plan.service.js';
import { createDeploymentService } from '../services/deployments/deployment.service.js';
import { createRecommendationService } from '../services/recommendations/recommendation.service.js';
import { createAiAuditService } from '../services/ai-audit/ai-audit.service.js';
import { createN8nAiAuditTrigger } from '../services/ai-audit/n8n-ai-audit-trigger.js';
import { createN8nAnalysisTrigger } from '../services/analysis/n8n-analysis-trigger.js';
import { createN8nDeploymentTrigger } from '../services/deployments/n8n-deployment-trigger.js';
import { createUserService } from '../services/users/user.service.js';
import { createUserApprovalService } from '../services/users/user-approval.service.js';
import { createProfileService } from '../services/profile/profile.service.js';
import { createAnalysisRouter } from './analysis.routes.js';

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
  const analyses = new AnalysisRepository();
  const recommendations = new RecommendationRepository();
  const plans = new PlanRepository();
  const deployments = new DeploymentRepository();
  const auditLogs = new AuditLogRepository();

  // Shared services
  const sessions = createSessionTokenService(env.sessionSecret);
  const authService = createAuthService(users);
  const userService = createUserService(users);
  const approvalService = createUserApprovalService(users);
  const projectService = createProjectService(projects);
  const profileService = createProfileService(users);
  const repositoryLink = createRepositoryLinkService(projects);
  const analysisTrigger = createN8nAnalysisTrigger(env.n8nAnalysisWebhookUrl, env.n8nSharedSecret);
  const deploymentTrigger = createN8nDeploymentTrigger(
    env.n8nDeploymentWebhookUrl,
    env.n8nSharedSecret,
  );
  const recommendationService = createRecommendationService(recommendations, analyses, auditLogs);
  const aiAuditTrigger = createN8nAiAuditTrigger(env.n8nAiAuditWebhookUrl, env.n8nSharedSecret);
  const aiAuditService = createAiAuditService(aiAuditTrigger, analyses, projects, auditLogs);
  const analysisService = createAnalysisService(
    analyses,
    projects,
    analysisTrigger,
    recommendationService,
    auditLogs,
  );
  const planService = createPlanService(
    plans,
    projects,
    deployments,
    auditLogs,
    analyses,
    recommendations,
    deploymentTrigger,
  );
  const deploymentService = createDeploymentService(deployments, projects, auditLogs);
  const requireInternalSecret = createRequireInternalSecret(env.n8nSharedSecret);
  const githubOAuthService = createGithubOAuthService(
    env.githubClientId,
    env.githubClientSecret,
    env.githubCallbackUrl,
  );

  const githubAuthService = createGithubAuthService(users, identities);

  // Authentication middleware
  const requireAuth = createRequireAuth(sessions, userService);

  // Main API router
  const router = Router();

  // Email/password authentication
  router.use('/auth', createAuthRouter(authService, sessions, requireAuth));

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
  router.use('/admin', createUserApprovalRouter(approvalService, requireAuth));

  // Administrator user management
  router.use('/admin', createUsersRouter(userService, requireAuth));

  // User project management
  router.use('/projects', createProjectRouter(projectService, requireAuth));
  router.use('/projects', createRepositoryLinkRouter(repositoryLink, requireAuth));
  router.use('/projects', createAnalysisRouter(analysisService, requireAuth));
  router.use('/projects', createRecommendationRouter(recommendationService, requireAuth));
  router.use('/projects', createAiAuditRouter(aiAuditService, requireAuth));

  // Cross-project pipeline boards (analyses / plans / deployments)
  router.use('/analyses', createAnalysisGlobalRouter(analysisService, requireAuth));
  router.use('/plans', createPlanRouter(planService, requireAuth));
  router.use('/deployments', createDeploymentRouter(deploymentService, requireAuth));

  router.use(
    '/internal/analyses',
    createAnalysisInternalRouter(analysisService, requireInternalSecret),
  );
  router.use(
    '/internal/analyses',
    createRecommendationInternalRouter(recommendationService, requireInternalSecret),
  );
  router.use(
    '/internal/analyses',
    createAiAuditInternalRouter(aiAuditService, requireInternalSecret),
  );
  router.use(
    '/internal/deployments',
    createDeploymentInternalRouter(deploymentService, requireInternalSecret),
  );
  // Self-scoped profile (self-vs-admin read: mounted at /profile)
  router.use('/profile', createProfileRouter(profileService, requireAuth));

  return router;
}
