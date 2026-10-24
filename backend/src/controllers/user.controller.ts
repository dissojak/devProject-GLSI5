
import type { RequestHandler } from 'express';
import { z } from 'zod';

import { AppError } from '../domain/errors/index.js';
import type { AuthUser } from '../types/index.js';
import type { UserService } from '../types/index.js';

import {
  userIdSchema,
  searchUsersSchema,
  updateUserSchema,
  changeRoleSchema,
} from '../services/users/user.schema.js';

function validate<T>(
  schema: z.ZodType<T>,
  value: unknown,
): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid request data',
      z.flattenError(result.error),
    );
  }

  return result.data;
}

function getId(params: unknown): string {
  return validate(userIdSchema, params).id;
}

function getActor(res: {
  locals: Record<string, unknown>;
}): AuthUser {
  const actor = res.locals.authUser as AuthUser;
  return actor;
}

export function createListUsersController(
  service: UserService,
): RequestHandler {
  return async (req, res) => {
    const input = validate(
      searchUsersSchema,
      req.query,
    );

    const result = await service.listUsers(input);

    res.status(200).json(result);
  };
}

export function createGetUserController(
  service: UserService,
): RequestHandler {
  return async (req, res) => {
    const id = getId(req.params);

    const user = await service.getUser(id);

    res.status(200).json({ data: user });
  };
}

export function createUpdateUserController(
  service: UserService,
): RequestHandler {
  return async (req, res) => {
    const id = getId(req.params);

    const input = validate(
      updateUserSchema,
      req.body,
    );

    const user = await service.updateUser(id, input);

    res.status(200).json({ data: user });
  };
}

export function createChangeRoleController(
  service: UserService,
): RequestHandler {
  return async (req, res) => {
    const id = getId(req.params);

    const input = validate(
      changeRoleSchema,
      req.body,
    );

    const actor = getActor(res);

    const user = await service.changeRole(
      actor.id,
      id,
      input.role,
    );

    res.status(200).json({ data: user });
  };
}

export function createDeactivateUserController(
  service: UserService,
): RequestHandler {
  return async (req, res) => {
    const id = getId(req.params);
    const actor = getActor(res);

    const user = await service.deactivateUser(
      actor.id,
      id,
    );

    res.status(200).json({ data: user });
  };
}

export function createReactivateUserController(
  service: UserService,
): RequestHandler {
  return async (req, res) => {
    const id = getId(req.params);

    const user = await service.reactivateUser(id);

    res.status(200).json({ data: user });
  };
}
