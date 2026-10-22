
import type { RequestHandler } from 'express';

import { AppError } from '../domain/errors/index.js';
import type { AuthServiceContract } from '../services/auth/auth.service.js';
import { registerSchema } from '../services/auth/register.schema.js';
import { loginSchema } from '../services/auth/login.schema.js';

export function createRegisterController(
  authService: AuthServiceContract,
): RequestHandler {
  return async (req, res) => {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Invalid registration data',
        result.error.flatten(),
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
  authService: AuthServiceContract,
): RequestHandler {
  return async (req, res) => {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Invalid login data',
        result.error.flatten(),
      );
    }

    const user = await authService.login(result.data);

    res.status(200).json({
      message: 'Credentials verified successfully',
      data: user,
    });
  };
}

