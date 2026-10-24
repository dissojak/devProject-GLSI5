import type { RequestHandler } from 'express';

import { UnauthorizedError } from '../domain/errors/index.js';

/**
 * Wiring bag, injected by routes/index.ts. A middleware may not import
 * repositories or services (dependency direction, docs/conventions.md),
 * so everything it needs arrives as plain functions.
 */
export interface RequireAuthDeps {
  /** session token -> user id (throws when invalid or expired) */
  verifyToken: (token: string) => Promise<string>;
  /** fresh read from the database, on EVERY request */
  findUserById: (
    id: string,
  ) => Promise<{ id: string; assertCanAuthenticate(): void } | null>;
}

/** "Authorization: Bearer <token>" -> "<token>" */
function readBearerToken(header: string | undefined): string | undefined {
  const [scheme, token] = header?.split(' ') ?? [];

  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
}

/**
 * Route guard, used directly on the route line:
 *   router.get('/', requireAuth, controller)
 * Reads the Bearer token, reloads the user, rejects deactivated accounts
 * and exposes the user id as `res.locals.userId`.
 */
export function createRequireAuth(deps: RequireAuthDeps): RequestHandler {
  // jose errors (expired, bad signature...) are not domain errors:
  // answer 401 instead of letting them become a 500.
  async function readUserId(token: string): Promise<string> {
    try {
      return await deps.verifyToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired session');
    }
  }

  return async (req, res, next) => {
    const token = readBearerToken(req.headers.authorization);

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await deps.findUserById(await readUserId(token));

    if (!user) {
      throw new UnauthorizedError('Account not found');
    }

    user.assertCanAuthenticate();

    res.locals.userId = user.id;
    next();
  };
}