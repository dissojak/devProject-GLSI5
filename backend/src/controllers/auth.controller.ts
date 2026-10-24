
import type { RequestHandler } from 'express';
import { z } from 'zod';

import { AppError } from '../domain/errors/index.js';
import type { AuthService } from '../services/auth/auth.service.js';
import { registerSchema } from '../services/auth/register.schema.js';
import { loginSchema } from '../services/auth/login.schema.js';
import type { SessionTokenService } from '../types/index.js';


export function createRegisterController(
  authService: AuthService,
): RequestHandler {
  return async (req, res) => {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      // z.flattenError(): zod 4 replacement for the deprecated
      // result.error.flatten() (see docs/conventions.md, "Zod rules (v4)").
      throw new AppError(
        'VALIDATION_ERROR',
        'Invalid registration data',
        z.flattenError(result.error),
      );
    }

    const user = await authService.register(result.data);

    res.status(201).json({
      message:'Registration submitted. Awaiting administrator approval.',
      data: user,
    });
  };
}



export function createLoginController(
  authService: AuthService,
  sessions: SessionTokenService,
): RequestHandler {
  return async (req, res) => {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Invalid login data',
        z.flattenError(result.error),
      );
    }

    // Vérifier les identifiants via le service métier
    const user = await authService.login(result.data);

    // Créer un JWT avec le service existant
    const accessToken = await sessions.create(user.id);

    res.setHeader('Cache-Control', 'no-store');

    res.status(200).json({
      message: 'Login successful',
      data: user,
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
  };
}


