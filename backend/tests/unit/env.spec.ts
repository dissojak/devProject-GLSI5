import { describe, expect, it } from 'vitest';

import { loadEnv } from '../../src/config/env.js';

const VALID = {
  NODE_ENV: 'test',
  PORT: '4000',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/x',
  CORS_ORIGINS: 'http://localhost:3000, http://localhost:3001',
  LOG_LEVEL: 'info',
  TOKEN_ENCRYPTION_KEY: 'RtcY2OnO4aHlOr8T+s1IMgJeDXqAtkOLEd5FIqTt45o=',
};

describe('config/env', () => {
  it('accepts a valid environment and parses CORS origins', () => {
    const env = loadEnv(VALID);

    expect(env.corsOrigins).toEqual(['http://localhost:3000', 'http://localhost:3001']);
    expect(env.tokenEncryptionKey).toHaveLength(32);
    expect(env.port).toBe(4000);
    expect(env.nodeEnv).toBe('test');
  });

  it('rejects a TOKEN_ENCRYPTION_KEY that is not exactly 32 bytes', () => {
    expect(() => loadEnv({ ...VALID, TOKEN_ENCRYPTION_KEY: 'aGVsbG8=' })).toThrow(
      'Invalid environment configuration',
    );
  });

  it('rejects a TOKEN_ENCRYPTION_KEY that is not base64', () => {
    expect(() => loadEnv({ ...VALID, TOKEN_ENCRYPTION_KEY: '****' })).toThrow(
      'Invalid environment configuration',
    );
  });

  it('rejects a missing MONGODB_URI', () => {
    const withoutUri = { ...VALID } as { -readonly [K in keyof typeof VALID]?: string };

    delete withoutUri.MONGODB_URI;

    expect(() => loadEnv(withoutUri)).toThrow('Invalid environment configuration');
  });

  it('rejects an empty CORS_ORIGINS list', () => {
    expect(() => loadEnv({ ...VALID, CORS_ORIGINS: ' , ' })).toThrow(
      /CORS_ORIGINS must contain at least one origin/,
    );
  });
});
