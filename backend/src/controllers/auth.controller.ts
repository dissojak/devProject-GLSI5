
import type { RequestHandler } from 'express';
import { z } from 'zod';

import { AppError } from '../domain/errors/index.js';
import type { AuthService } from '../services/auth/auth.service.js';
import { registerSchema } from '../services/auth/register.schema.js';
import { loginSchema } from '../services/auth/login.schema.js';

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
      message: 'User registered successfully',
      data: user,
    });
  };
}

export function createLoginController(
  authService: AuthService,
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

    const user = await authService.login(result.data);

    res.status(200).json({
      message: 'Credentials verified successfully',
      data: user,
    });
  };
}
