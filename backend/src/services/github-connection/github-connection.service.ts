import { z } from 'zod';

import {
  ConflictError,
  UnauthorizedError,
} from '../../domain/errors/index.js';

import { GithubConnectionRepository } from '../../repositories/github-connection.repository.js';

import {
  createSignedState,
  readSignedState,
} from '../../shared/security/signed-state.js';

import type { GithubOAuthService } from '../auth/github-oauth.service.js';

const STATE_TTL_MS = 10 * 60 * 1000;
const GITHUB_TIMEOUT_MS = 10_000;
const REPOSITORY_PAGES = 3;
const PRIVATE_SCOPE = 'repo';

const repositoryPageSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    full_name: z.string(),
    private: z.boolean(),
    html_url: z.string(),
    description: z.string().nullable(),
    default_branch: z.string(),
    updated_at: z.string().nullable(),
    owner: z.object({ login: z.string() }),
  }),
);

export interface GithubRepositorySummary {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  url: string;
  description: string | null;
  defaultBranch: string;
  updatedAt: string | null;
}

async function fetchRepositoryPage(
  token: string,
  page: number,
): Promise<z.infer<typeof repositoryPageSchema>> {
  const query = new URLSearchParams({
    per_page: '100',
    page: String(page),
    sort: 'updated',
    affiliation: 'owner,collaborator,organization_member',
  });

  let response: Response;

  try {
    response = await fetch(`https://api.github.com/user/repos?${query}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'deploymentplanner-ai',
      },
      signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
    });
  } catch {
    throw new ConflictError('GitHub is unreachable, try again later');
  }

  if (response.status === 401) {
    throw new ConflictError('GitHub access expired. Connect GitHub again.');
  }

  if (!response.ok) {
    throw new ConflictError(`GitHub request failed (${response.status})`);
  }

  return repositoryPageSchema.parse(await response.json());
}

function toSummary(
  repository: z.infer<typeof repositoryPageSchema>[number],
): GithubRepositorySummary {
  return {
    id: repository.id,
    owner: repository.owner.login,
    name: repository.name,
    fullName: repository.full_name,
    private: repository.private,
    url: repository.html_url,
    description: repository.description,
    defaultBranch: repository.default_branch,
    updatedAt: repository.updated_at,
  };
}

export function createGithubConnectionService(
  oauth: GithubOAuthService,
  tokenKey: Uint8Array,
  stateSecret: string,
  connections: GithubConnectionRepository = new GithubConnectionRepository(),
) {
  function start(userId: string, returnTo: string): { url: string } {
    const state = createSignedState(stateSecret, { userId, returnTo }, STATE_TTL_MS);

    return { url: oauth.getRepositoryAccessUrl(state) };
  }

  function readState(state: string): { userId: string; returnTo: string } {
    const payload = readSignedState(stateSecret, state);

    if (!payload) {
      throw new UnauthorizedError('GitHub connection request expired or is invalid');
    }

    return payload;
  }

  async function complete(code: string, state: string): Promise<{ returnTo: string }> {
    const { userId, returnTo } = readState(state);
    const grant = await oauth.exchangeRepositoryCode(code);
    const existing = await connections.findByUser(userId);

    if (existing) {
      await existing.reconnect(tokenKey, grant);
    } else {
      await connections.connectUser(tokenKey, { userId, ...grant });
    }

    return { returnTo };
  }

  async function status(userId: string) {
    const connection = await connections.findByUser(userId);
    const active = connection !== null && connection.get('revokedAt') == null;

    return {
      connected: active,
      login: active ? connection.githubLogin : null,
      scopes: active ? connection.scopes : [],
      privateRepositories: active && connection.scopes.includes(PRIVATE_SCOPE),
    };
  }

  async function accessToken(userId: string): Promise<string | null> {
    const connection = await connections.findByUserWithToken(userId);

    if (!connection || connection.get('revokedAt') != null) {
      return null;
    }

    return connection.getAccessToken(tokenKey);
  }

  async function listRepositories(userId: string): Promise<GithubRepositorySummary[]> {
    const token = await accessToken(userId);

    if (!token) {
      throw new ConflictError('Connect your GitHub account to list repositories');
    }

    const repositories: GithubRepositorySummary[] = [];

    for (let page = 1; page <= REPOSITORY_PAGES; page += 1) {
      const batch = await fetchRepositoryPage(token, page);
      repositories.push(...batch.map(toSummary));
      if (batch.length < 100) break;
    }

    return repositories;
  }

  async function disconnect(userId: string): Promise<void> {
    const connection = await connections.findByUserWithToken(userId);

    if (connection && connection.get('revokedAt') == null) {
      await connection.revoke();
    }
  }

  return {
    start,
    complete,
    status,
    accessToken,
    listRepositories,
    disconnect,
  };
}

export type GithubConnectionService = ReturnType<typeof createGithubConnectionService>;
