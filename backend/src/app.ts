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
/**
 * App factory: assembles middleware and routes WITHOUT listening and WITHOUT
 * touching the database, so tests can import it freely (see tests/http).
 * Only server.ts (and nothing else) listens and connects.
 */
export function createApp(logger: Logger): Express {
  const env = getEnv();
  const app: Express = express();

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
  const userRepository = new UserRepository();
  const authService = new AuthService(userRepository);
  const registerController = createRegisterController(authService);
  const loginController = createLoginController(authService);

  app.use(healthRouter);

  app.use(
  '/api/v1/auth',
  createAuthRouter(
    registerController,
    loginController,
  ),
);
  if (env.nodeEnv !== 'production') {
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument),
    );
  }



  app.use(notFound());
  app.use(errorHandler(logger));

  return app;
}
