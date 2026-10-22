import type { Express } from 'express';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';

import { getEnv } from './config/env.js';
import { notFound } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogging } from './middleware/request-logging.js';
import { healthRouter } from './routes/health.routes.js';
import { createAuthRouter } from './routes/auth.routes.js';
import {
  createRegisterController,
  createLoginController,
} from './controllers/auth.controller.js';
import { AuthService } from './services/auth/auth.service.js';
import { UserRepository } from './repositories/user.repository.js';

import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from '../docs/swagger.js';


import cookieParser from 'cookie-parser';

import {
  GithubOAuthService,
} from './services/auth/github-oauth.service.js';

import { GithubAuthService,
} from './services/auth/github-auth.service.js';

import {
  SessionTokenService,
} from './services/auth/session-token.service.js';

import {
  AuthIdentityRepository,
} from './repositories/auth-identity.repository.js';

import {
  createGithubAuthController,
} from './controllers/github-auth.controller.js';

import {
  createGithubAuthRouter,
} from './routes/github-auth.routes.js';

/**
 * App factory: assembles middleware and routes WITHOUT listening and WITHOUT
 * touching the database, so tests can import it freely (see tests/http).
 * Only server.ts (and nothing else) listens and connects.
 */
export function createApp(logger: Logger): Express {
  const env = getEnv();
  const app: Express = express();

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL;
  const frontendUrl = process.env.FRONTEND_URL;
  const sessionSecret = process.env.SESSION_SECRET;

  if (
    !clientId ||
    !clientSecret ||
    !callbackUrl ||
    !frontendUrl ||
    !sessionSecret
  ) {
    throw new Error('Missing GitHub OAuth configuration');
  }

  app.disable('x-powered-by');

  app.use(requestLogging(logger));
  app.use(helmet());

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser(sessionSecret));

  // Services
  const userRepository = new UserRepository();

  const authService = new AuthService(userRepository);

  const registerController =
    createRegisterController(authService);

  const loginController =
    createLoginController(authService);

  // Authentification email/password
  app.use(
    '/api/v1/auth',
    createAuthRouter(
      registerController,
      loginController,
    ),
  );

  // Authentification GitHub OAuth
  const oauthService = new GithubOAuthService(
    clientId,
    clientSecret,
    callbackUrl,
  );

  const githubAuthService = new GithubAuthService(
    userRepository,
    new AuthIdentityRepository(),
  );

  const sessionService = new SessionTokenService(
    sessionSecret,
  );

  const githubController = createGithubAuthController(
    oauthService,
    githubAuthService,
    sessionService,
    frontendUrl,
    env.nodeEnv === 'production',
  );
  app.use('/api/v1/auth/github/callback', (req, _res, next) => {
  console.log('GITHUB CALLBACK REACHED:', req.method);
  next();
});
  app.use(
    '/api/v1/auth',
    createGithubAuthRouter(
      githubController.start,
      githubController.callback,
    ),
  );

  // Health
  app.use(healthRouter);

  // Swagger
  if (env.nodeEnv !== 'production') {
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument),
    );
  }

  // Toujours en dernier
  app.use(notFound());
  app.use(errorHandler(logger));

  return app;
}