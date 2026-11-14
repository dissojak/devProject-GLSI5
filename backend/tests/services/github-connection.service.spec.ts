import { afterEach, describe, expect, it, vi } from 'vitest';

import type { GithubConnectionRepository } from '../../src/repositories/github-connection.repository.js';
import type { GithubOAuthService } from '../../src/services/auth/github-oauth.service.js';
import { createGithubConnectionService } from '../../src/services/github-connection/github-connection.service.js';

const KEY = new Uint8Array(32);
const SECRET = 'state-secret-that-is-long-enough-xxxxxxxx';
const GRANT = { token: 'gho_token', scopes: ['repo', 'read:user'], login: 'octocat' };

function build(connection: Record<string, unknown> | null = null) {
  const oauth = {
    getRepositoryAccessUrl: vi.fn((state: string) => `https://github.com/login/oauth/authorize?state=${state}`),
    exchangeRepositoryCode: vi.fn().mockResolvedValue(GRANT),
  } as unknown as GithubOAuthService;
  const connections = {
    findByUser: vi.fn().mockResolvedValue(connection),
    findByUserWithToken: vi.fn().mockResolvedValue(connection),
    connectUser: vi.fn().mockResolvedValue({}),
  };
  const service = createGithubConnectionService(
    oauth,
    KEY,
    SECRET,
    connections as unknown as GithubConnectionRepository,
  );

  return { oauth, connections, service };
}

function activeConnection() {
  return {
    githubLogin: 'octocat',
    scopes: ['repo', 'read:user'],
    get: (field: string) => (field === 'revokedAt' ? null : undefined),
    getAccessToken: vi.fn().mockReturnValue('gho_token'),
    reconnect: vi.fn().mockResolvedValue({}),
    revoke: vi.fn().mockResolvedValue({}),
  };
}

function stateOf(url: string): string {
  return new URL(url).searchParams.get('state') ?? '';
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GitHub repository connection', () => {
  it('stores a first connection for the user who started the flow', async () => {
    const { service, connections } = build();
    const { url } = service.start('u1', '/projects?new=1');

    const result = await service.complete('code-1', stateOf(url));

    expect(result).toEqual({ returnTo: '/projects?new=1' });
    expect(connections.connectUser).toHaveBeenCalledWith(KEY, { userId: 'u1', ...GRANT });
  });

  it('reconnects an existing connection instead of creating a second one', async () => {
    const connection = activeConnection();
    const { service, connections } = build(connection);

    await service.complete('code-1', stateOf(service.start('u1', '/projects').url));

    expect(connection.reconnect).toHaveBeenCalledWith(KEY, GRANT);
    expect(connections.connectUser).not.toHaveBeenCalled();
  });

  it('refuses a forged state', async () => {
    const { service, oauth } = build();

    await expect(service.complete('code-1', 'forged.state')).rejects.toThrow(/expired or is invalid/);
    expect(oauth.exchangeRepositoryCode).not.toHaveBeenCalled();
  });

  it('reports private-repository access from the granted scopes', async () => {
    expect(await build(activeConnection()).service.status('u1')).toEqual({
      connected: true,
      login: 'octocat',
      scopes: ['repo', 'read:user'],
      privateRepositories: true,
    });
    expect(await build().service.status('u1')).toEqual({
      connected: false,
      login: null,
      scopes: [],
      privateRepositories: false,
    });
  });

  it('lists public and private repositories with the stored token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 1,
            name: 'secret-app',
            full_name: 'octocat/secret-app',
            private: true,
            html_url: 'https://github.com/octocat/secret-app',
            description: null,
            default_branch: 'develop',
            updated_at: '2026-11-14T10:00:00Z',
            owner: { login: 'octocat' },
          },
        ]),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const repositories = await build(activeConnection()).service.listRepositories('u1');

    expect(repositories).toEqual([
      {
        id: 1,
        owner: 'octocat',
        name: 'secret-app',
        fullName: 'octocat/secret-app',
        private: true,
        url: 'https://github.com/octocat/secret-app',
        description: null,
        defaultBranch: 'develop',
        updatedAt: '2026-11-14T10:00:00Z',
      },
    ]);
    const headers = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer gho_token');
  });

  it('asks the user to connect before listing repositories', async () => {
    await expect(build().service.listRepositories('u1')).rejects.toThrow(/Connect your GitHub account/);
  });
});
