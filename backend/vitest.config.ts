import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    // First-ever run downloads the MongoDB testing binary; keep hooks patient.
    hookTimeout: 120_000,
    testTimeout: 60_000,
    // Seed a VALID environment before any import runs, so `config/env` passes
    // validation in tests. A local mongodb-memory-server instance provides the
    // real database in integration tests; this value is never connected to.
    env: {
      NODE_ENV: 'test',
      PORT: '4000',
      MONGODB_URI: 'mongodb+srv://dissojak:stoondissojakb2a@stoon.r8tcyqv.mongodb.net/ARTIFEX-For-PFE?retryWrites=true&w=majority',
      CORS_ORIGINS: 'http://localhost:3000',
      LOG_LEVEL: 'warn',
      // Dummy 32-byte base64 value for tests only (not a secret).
      TOKEN_ENCRYPTION_KEY: 'RtcY2OnO4aHlOr8T+s1IMgJeDXqAtkOLEd5FIqTt45o=',
    },
  },
});
