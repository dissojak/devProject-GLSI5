
import { z } from 'zod';

const tokenSchema = z.object({
  access_token: z.string().min(1),
});

const profileSchema = z.object({
  id: z.number(),
  login: z.string(),
  name: z.string().nullable(),
});

const emailSchema = z.array(z.object({
  email: z.email(),
  primary: z.boolean(),
  verified: z.boolean(),
}));

export interface GithubProfile {
  githubId: string;
  name: string;
  email: string;
}

export class GithubOAuthService {
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly callbackUrl: string,
  ) {}

  getAuthorizationUrl(
    state: string,
    challenge: string,
  ): string {
    const url = new URL(
      'https://github.com/login/oauth/authorize',
    );

    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.callbackUrl);
    url.searchParams.set('scope', 'read:user user:email');
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');

    return url.toString();
  }

  async getProfile(
    code: string,
    verifier: string,
  ): Promise<GithubProfile> {
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.callbackUrl,
          code,
          code_verifier: verifier,
        }),
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!tokenResponse.ok) {
      throw new Error('GitHub token exchange failed');
    }

    const token = tokenSchema.parse(
      await tokenResponse.json(),
    );

    const headers = {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token.access_token}`,
    };

    const [userResponse, emailResponse] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers,
        signal: AbortSignal.timeout(10000),
      }),
      fetch('https://api.github.com/user/emails', {
        headers,
        signal: AbortSignal.timeout(10000),
      }),
    ]);

    if (!userResponse.ok || !emailResponse.ok) {
      throw new Error('GitHub profile retrieval failed');
    }

    const user = profileSchema.parse(
      await userResponse.json(),
    );

    const emails = emailSchema.parse(
      await emailResponse.json(),
    );

    const primary = emails.find(
      (item) => item.primary && item.verified,
    );

    if (!primary) {
      throw new Error('Verified primary email required');
    }

    return {
      githubId: String(user.id),
      name: user.name || user.login,
      email: primary.email.toLowerCase(),
    };
  }
}
