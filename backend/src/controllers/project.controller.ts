import type { RequestHandler } from 'express';
import { z } from 'zod';

import { AppError } from '../domain/errors/index.js';
import type { ProjectService } from '../services/project/project.service.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
} from '../services/project/project.schema.js';

// `res.locals.userId` is set by the requireAuth guard on the route line.

// z.flattenError(): zod 4 replacement for the deprecated
// result.error.flatten() (see docs/conventions.md, "Zod rules (v4)").
function parseOrThrow<T>(
  schema: z.ZodType<T>,
  data: unknown,
  message: string,
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      message,
      z.flattenError(result.error),
    );
  }

  return result.data;
}

export function createCreateProjectController(
  projectService: ProjectService,
): RequestHandler {
  return async (req, res) => {
    const input = parseOrThrow(createProjectSchema, req.body, 'Invalid project data');
    const project = await projectService.create(res.locals.userId, input);

    res.status(201).json({
      message: 'Project created successfully',
      data: project,
    });
  };
}

export function createListProjectsController(
  projectService: ProjectService,
): RequestHandler {
  return async (_req, res) => {
    const projects = await projectService.list(res.locals.userId);

    res.status(200).json({
      message: 'Projects retrieved successfully',
      data: projects,
    });
  };
}

export function createGetProjectController(
  projectService: ProjectService,
): RequestHandler {
  return async (req, res) => {
    const id = parseOrThrow(projectIdSchema, req.params.id, 'Invalid project id');
    const project = await projectService.get(res.locals.userId, id);

    res.status(200).json({
      message: 'Project retrieved successfully',
      data: project,
    });
  };
}

export function createUpdateProjectController(
  projectService: ProjectService,
): RequestHandler {
  return async (req, res) => {
    const id = parseOrThrow(projectIdSchema, req.params.id, 'Invalid project id');
    const input = parseOrThrow(updateProjectSchema, req.body, 'Invalid project data');
    const project = await projectService.update(res.locals.userId, id, input);

    res.status(200).json({
      message: 'Project updated successfully',
      data: project,
    });
  };
}

export function createDeleteProjectController(
  projectService: ProjectService,
): RequestHandler {
  return async (req, res) => {
    const id = parseOrThrow(projectIdSchema, req.params.id, 'Invalid project id');

    await projectService.remove(res.locals.userId, id);

    res.status(200).json({ message: 'Project deleted successfully' });
  };
}