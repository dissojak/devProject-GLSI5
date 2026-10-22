
import { SignJWT, jwtVerify } from 'jose';

export class SessionTokenService {
  private readonly key: Uint8Array;

  constructor(secret: string) {
    this.key = new TextEncoder().encode(secret);

    if (this.key.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 bytes');
    }
  }

  async create(userId: string): Promise<string> {
    return new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuer('deploymentplanner-ai')
      .setAudience('deploymentplanner-web')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(this.key);
  }

  async verify(token: string): Promise<string> {
    const { payload } = await jwtVerify(token, this.key, {
      issuer: 'deploymentplanner-ai',
      audience: 'deploymentplanner-web',
      algorithms: ['HS256'],
    });

    if (!payload.sub) {
      throw new Error('Invalid session');
    }

    return payload.sub;
  }
}
