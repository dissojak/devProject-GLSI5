
import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import type { RequestHandler, Response } from 'express';

import { GithubOAuthService } from '../services/auth/github-oauth.service.js';
import { GithubAuthService } from '../services/auth/github-auth.service.js';
import { SessionTokenService } from '../services/auth/session-token.service.js';

const OAUTH_MAX_AGE = 5 * 60 * 1000;

function equalState(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);

  return x.length === y.length && timingSafeEqual(x, y);
}

export function createGithubAuthController(
  oauth: GithubOAuthService,
  auth: GithubAuthService,
  sessions: SessionTokenService,
  frontendUrl: string,
  secureCookies: boolean,
) {
  const oauthCookieOptions = {
    httpOnly: true,
    secure: secureCookies,
    sameSite: 'lax' as const,
    signed: true,
    path: '/api/v1/auth/github',
    maxAge: OAUTH_MAX_AGE,
  };

  function clearOAuthCookies(res: Response): void {
    const options = {
      httpOnly: true,
      secure: secureCookies,
      sameSite: 'lax' as const,
      path: '/api/v1/auth/github',
    };

    res.clearCookie('oauth_state', options);
    res.clearCookie('oauth_verifier', options);
  }

  const start: RequestHandler = (_req, res) => {
    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(32).toString('base64url');

    const challenge = createHash('sha256')
      .update(verifier)
      .digest('base64url');

    res.cookie('oauth_state', state, oauthCookieOptions);
    res.cookie('oauth_verifier', verifier, oauthCookieOptions);

    res.redirect(oauth.getAuthorizationUrl(state, challenge));
  };

  const callback: RequestHandler = async (req, res) => {
    const state = req.query.state;
    const code = req.query.code;

    const savedState: unknown =
      req.signedCookies?.oauth_state;

    const verifier: unknown =
      req.signedCookies?.oauth_verifier;

    clearOAuthCookies(res);

    if (
      typeof state !== 'string' ||
      typeof code !== 'string' ||
      typeof savedState !== 'string' ||
      typeof verifier !== 'string' ||
      !equalState(state, savedState)
    ) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid OAuth state or callback',
        },
      });
      return;
    }

    const profile = await oauth.getProfile(code, verifier);

    const user = await auth.login(profile);

    const token = await sessions.create(user.id);

    res.cookie('session', token, {
      httpOnly: true,
      secure: secureCookies,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 1000,
    });

  res.status(200).json({
  message: 'GitHub authentication successful',
  data: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    },
    });
};

  return { start, callback };
}
