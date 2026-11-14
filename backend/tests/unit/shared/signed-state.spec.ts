import { describe, expect, it } from 'vitest';

import { createSignedState, readSignedState } from '../../../src/shared/security/signed-state.js';

const SECRET = 'test-secret-that-is-long-enough-for-hmac';
const PAYLOAD = { userId: 'u1', returnTo: '/projects?new=1' };

describe('signed OAuth state', () => {
  it('round-trips the payload before it expires', () => {
    const state = createSignedState(SECRET, PAYLOAD, 60_000, 1_000);

    expect(readSignedState(SECRET, state, 30_000)).toEqual(PAYLOAD);
  });

  it('rejects an expired, tampered or foreign state', () => {
    const state = createSignedState(SECRET, PAYLOAD, 60_000, 1_000);
    const [body, signature] = state.split('.');
    const forged = Buffer.from(JSON.stringify({ ...PAYLOAD, userId: 'attacker', expiresAt: 9e15, nonce: 'x' }))
      .toString('base64url');

    expect(readSignedState(SECRET, state, 120_000)).toBeNull();
    expect(readSignedState(SECRET, `${forged}.${signature}`, 30_000)).toBeNull();
    expect(readSignedState('another-secret-entirely-xxxxxxxxxxxxxx', state, 30_000)).toBeNull();
    expect(readSignedState(SECRET, body ?? '', 30_000)).toBeNull();
  });
});
