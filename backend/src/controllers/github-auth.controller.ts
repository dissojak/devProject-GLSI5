import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import type { RequestHandler, Response } from 'express';

import type { GithubOAuthService } from '../services/auth/github-oauth.service.js';
import type { GithubAuthService } from '../services/auth/github-auth.service.js';
import type { SessionTokenService } from '../services/auth/session-token.service.js';

const OAUTH_MAX_AGE = 5 * 60 * 1000;

/**
 * One shared dependency bag for the GitHub OAuth feature. Built ONCE by
 * routes/index.ts (the composition root) and passed to every controller
 * factory below, so each route line can wire itself directly:
 *   router.get('/github', createGithubStartController(deps));
 */
export interface GithubAuthDeps {
  oauth: GithubOAuthService;
  auth: GithubAuthService;
  sessions: SessionTokenService;
  frontendUrl: string;
  secureCookies: boolean;
}

function equalState(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);

  return x.length === y.length && timingSafeEqual(x, y);
}

function oauthCookieOptions(secureCookies: boolean) {
  return {
    httpOnly: true,
    secure: secureCookies,
    sameSite: 'lax' as const,
    signed: true,
    path: '/api/v1/auth/github',
    maxAge: OAUTH_MAX_AGE,
  };
}

function clearOAuthCookies(res: Response, secureCookies: boolean): void {
  const options = {
    httpOnly: true,
    secure: secureCookies,
    sameSite: 'lax' as const,
    path: '/api/v1/auth/github',
  };

  res.clearCookie('oauth_state', options);
  res.clearCookie('oauth_verifier', options);
}

interface OAuthCallbackData {
  code: string;
  verifier: string;
}

function getOAuthCallbackData(
  state: unknown,
  code: unknown,
  savedState: unknown,
  verifier: unknown,
): OAuthCallbackData | null {
  if (typeof state !== 'string') return null;
  if (typeof code !== 'string') return null;
  if (typeof savedState !== 'string') return null;
  if (typeof verifier !== 'string') return null;
  if (!equalState(state, savedState)) return null;

  return { code, verifier };
}

/**
 * Factories take the deps bag and return route-ready handlers; service
 * contract TYPES come straight from each service file (source of truth).
 */
export function createGithubStartController(
  deps: GithubAuthDeps,
): RequestHandler {
  return (_req, res) => {
    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(32).toString('base64url');

    const challenge = createHash('sha256')
      .update(verifier)
      .digest('base64url');

    res.cookie('oauth_state', state, oauthCookieOptions(deps.secureCookies));
    res.cookie('oauth_verifier', verifier, oauthCookieOptions(deps.secureCookies));

    res.redirect(deps.oauth.getAuthorizationUrl(state, challenge));
  };
}

export function createGithubCallbackController(
  deps: GithubAuthDeps,
): RequestHandler {
  return async (req, res) => {
    const state = req.query.state;
    const code = req.query.code;

    const savedState: unknown =
      req.signedCookies?.oauth_state;

    const verifier: unknown =
      req.signedCookies?.oauth_verifier;

    clearOAuthCookies(res, deps.secureCookies);

    const callbackData = getOAuthCallbackData(
      state,
      code,
      savedState,
      verifier,
    );

    if (callbackData === null) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid OAuth state or callback',
        },
      });
      return;
    }

    const profile = await deps.oauth.getProfile(
      callbackData.code,
      callbackData.verifier,
    );

    const user = await deps.auth.login(profile);

    const token = await deps.sessions.create(user.id);

    res.cookie('session', token, {
      httpOnly: true,
      secure: deps.secureCookies,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 1000,
    });

    res.redirect(deps.frontendUrl);
  };
}
