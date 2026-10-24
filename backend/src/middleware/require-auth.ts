
import type { RequestHandler } from 'express';
import { Types } from 'mongoose';

import {
  UnauthorizedError,
} from '../domain/errors/index.js';

// Contracts come from src/types: middleware must not import services
// (docs/conventions.md, "Dependency direction").
import type {
  SessionTokenService,
  UserService,
} from '../types/index.js';

function extractBearerToken(
  authorization: string | undefined,
): string {
  if (!authorization) {
    throw new UnauthorizedError(
      'Bearer token required',
    );
  }

  const match = /^Bearer ([^\s]+)$/i.exec(authorization);

  if (!match?.[1]) {
    throw new UnauthorizedError(
      'Invalid Authorization header',
    );
  }

  return match[1];
}

export function createRequireAuth(
  sessions: SessionTokenService,
  users: UserService,
): RequestHandler {
  return async (req, res, next) => {
    const token = extractBearerToken(
      req.headers.authorization,
    );

    let userId: string;

    try {
      userId = await sessions.verify(token);
    } catch {
      throw new UnauthorizedError(
        'Invalid or expired access token',
      );
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedError(
        'Invalid token subject',
      );
    }

    // Important : recharger le compte à chaque requête.
    // Cela permet de rejeter les comptes désactivés
    // et de prendre en compte les changements de rôle.
    const user = await users.getAuthenticatedUser(userId);

    res.locals.authUser = user;

    next();
  };
}
