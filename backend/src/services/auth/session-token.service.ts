import { SignJWT, jwtVerify } from 'jose';

/**
 * Functional service factory (docs/conventions.md, "Services"). The secret is
 * injected by the composition root (routes/index.ts), never read from config.
 */
export function createSessionTokenService(
  secret: string,
) {
  const key = new TextEncoder().encode(secret);

  if (key.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 bytes');
  }

  async function create(userId: string): Promise<string> {
    return new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuer('deploymentplanner-ai')
      .setAudience('deploymentplanner-web')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(key);
  }

  async function verify(token: string): Promise<string> {
    const { payload } = await jwtVerify(token, key, {
      issuer: 'deploymentplanner-ai',
      audience: 'deploymentplanner-web',
      algorithms: ['HS256'],
    });

    if (!payload.sub) {
      throw new Error('Invalid session');
    }

    return payload.sub;
  }

  return { create, verify };
}

