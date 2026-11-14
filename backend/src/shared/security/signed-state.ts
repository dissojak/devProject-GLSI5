import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Tamper-proof, expiring OAuth `state`: base64url(JSON payload) + "." +
 * HMAC-SHA256 signature. Lets a browser redirect (which carries no Bearer
 * token) prove which signed-in user started the flow.
 */
export interface SignedStatePayload {
  userId: string;
  returnTo: string;
}

interface StateBody extends SignedStatePayload {
  nonce: string;
  expiresAt: number;
}

function sign(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

export function createSignedState(
  secret: string,
  payload: SignedStatePayload,
  ttlMs: number,
  now: number = Date.now(),
): string {
  const body: StateBody = {
    ...payload,
    nonce: randomBytes(12).toString('base64url'),
    expiresAt: now + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString('base64url');

  return `${encoded}.${sign(secret, encoded)}`;
}

function sameSignature(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);

  return x.length === y.length && timingSafeEqual(x, y);
}

export function readSignedState(
  secret: string,
  state: string,
  now: number = Date.now(),
): SignedStatePayload | null {
  const [encoded, signature] = state.split('.');

  if (!encoded || !signature || !sameSignature(signature, sign(secret, encoded))) {
    return null;
  }

  const body = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<StateBody>;

  if (typeof body.userId !== 'string' || typeof body.returnTo !== 'string') {
    return null;
  }

  if (typeof body.expiresAt !== 'number' || body.expiresAt < now) {
    return null;
  }

  return { userId: body.userId, returnTo: body.returnTo };
}
