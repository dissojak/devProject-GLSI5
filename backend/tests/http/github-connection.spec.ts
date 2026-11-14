import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging/logger.js';
import { User } from '../../src/models/entities/index.js';
import {
  connectTestingModule,
  disconnectTestingModule,
  stopMemoryServer,
} from '../integration/test-database.js';

const DEV = { name: 'Repo Dev', email: 'repo-dev@example.com', password: 'strong-pass-1' };

let app: Express;
let token: string;

beforeAll(async () => {
  await connectTestingModule('http_github_connection_test');
  app = createApp(createLogger('warn'));

  await request(app).post('/api/v1/auth/register').send(DEV);
  const dev = await User.findOne({ email: DEV.email });
  if (!dev) throw new Error('developer seed missing');
  await dev.approve();

  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: DEV.email, password: DEV.password });
  expect(res.status).toBe(200);
  token = res.body.accessToken as string;
});

afterAll(async () => {
  await disconnectTestingModule();
  await stopMemoryServer();
});

describe('GitHub repository connection over HTTP', () => {
  it('requires a signed-in user', async () => {
    expect((await request(app).get('/api/v1/github/connection')).status).toBe(401);
    expect((await request(app).get('/api/v1/github/repositories')).status).toBe(401);
  });

  it('reports no connection for a new user', async () => {
    const res = await request(app)
      .get('/api/v1/github/connection')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      connected: false,
      login: null,
      scopes: [],
      privateRepositories: false,
    });
  });

  it('starts an authorization asking for private repository access', async () => {
    const res = await request(app)
      .post('/api/v1/github/connection')
      .set('Authorization', `Bearer ${token}`)
      .send({ returnTo: '/projects?new=1' });

    expect(res.status).toBe(200);
    const url = new URL(res.body.data.url as string);
    expect(url.origin + url.pathname).toBe('https://github.com/login/oauth/authorize');
    expect(url.searchParams.get('scope')).toBe('repo read:user');
    expect(url.searchParams.get('redirect_uri')).toMatch(/\/auth\/github\/callback\/repositories$/);
    expect(url.searchParams.get('state')).toBeTruthy();
  });

  it('rejects an absolute return path', async () => {
    const res = await request(app)
      .post('/api/v1/github/connection')
      .set('Authorization', `Bearer ${token}`)
      .send({ returnTo: 'https://evil.example.com' });

    expect(res.status).toBe(400);
  });

  it('asks to connect before listing repositories', async () => {
    const res = await request(app)
      .get('/api/v1/github/repositories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
  });

  it('sends the browser back to the app when the callback state is forged', async () => {
    const res = await request(app).get(
      '/api/v1/auth/github/callback/repositories?code=abc&state=forged.state',
    );

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/projects\?github=repositories-failed$/);
  });
});
