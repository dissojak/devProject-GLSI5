import type { RequestHandler } from 'express';

import {
  githubConnectionCallbackSchema,
  startGithubConnectionSchema,
} from '../services/github-connection/github-connection.schema.js';
import type { GithubConnectionService } from '../services/github-connection/github-connection.service.js';
import { parseOrThrow } from '../shared/validation/request-validation.js';

const FALLBACK_RETURN = '/projects';

function frontendRedirect(frontendUrl: string, returnTo: string, outcome: string): string {
  const separator = returnTo.includes('?') ? '&' : '?';
  return `${frontendUrl}${returnTo}${separator}github=${outcome}`;
}

export function createGithubConnectionStatusController(
  connections: GithubConnectionService,
): RequestHandler {
  return async (_req, res) => {
    const status = await connections.status(res.locals.userId);

    res.status(200).json({ message: 'GitHub connection status', data: status });
  };
}

export function createStartGithubConnectionController(
  connections: GithubConnectionService,
): RequestHandler {
  return async (req, res) => {
    const input = parseOrThrow(startGithubConnectionSchema, req.body ?? {}, 'Invalid return path');

    res.status(200).json({
      message: 'GitHub authorization URL created',
      data: connections.start(res.locals.userId, input.returnTo),
    });
  };
}

export function createDisconnectGithubController(
  connections: GithubConnectionService,
): RequestHandler {
  return async (_req, res) => {
    await connections.disconnect(res.locals.userId);

    res.status(200).json({ message: 'GitHub disconnected', data: { connected: false } });
  };
}

export function createListGithubRepositoriesController(
  connections: GithubConnectionService,
): RequestHandler {
  return async (_req, res) => {
    const repositories = await connections.listRepositories(res.locals.userId);

    res.status(200).json({ message: 'GitHub repositories', data: repositories });
  };
}

/**
 * Browser navigation back from GitHub: never answers JSON, always redirects
 * to the app with `?github=repositories-connected|repositories-failed`.
 */
export function createGithubConnectionCallbackController(
  connections: GithubConnectionService,
  frontendUrl: string,
): RequestHandler {
  return async (req, res) => {
    const parsed = githubConnectionCallbackSchema.safeParse(req.query);

    if (!parsed.success) {
      res.redirect(302, frontendRedirect(frontendUrl, FALLBACK_RETURN, 'repositories-failed'));
      return;
    }

    try {
      const { returnTo } = await connections.complete(parsed.data.code, parsed.data.state);
      res.redirect(302, frontendRedirect(frontendUrl, returnTo, 'repositories-connected'));
    } catch {
      res.redirect(302, frontendRedirect(frontendUrl, FALLBACK_RETURN, 'repositories-failed'));
    }
  };
}
