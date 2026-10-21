import { z } from 'zod';

/**
 * Environment contract. Parsed and validated ONCE at startup (getEnv is
 * memoized). The process fails fast with a readable message if anything is
 * missing or malformed - never silently default to an unsafe configuration.
 */

const ENV_NODE_ENV = ['development', 'test', 'production'] as const;
const ENV_LOG_LEVEL = ['debug', 'info', 'warn', 'error'] as const;

const RawEnvSchema = z.object({
  NODE_ENV: z.enum(ENV_NODE_ENV).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().trim().min(1, 'MONGODB_URI is required'),
  CORS_ORIGINS: z.string().trim().min(1, 'CORS_ORIGINS is required (comma-separated origins list)'),
  LOG_LEVEL: z.enum(ENV_LOG_LEVEL).default('info'),
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .trim()
    .refine(
      (value) => /^[A-Za-z0-9+/]+={0,2}$/.test(value) && Buffer.from(value, 'base64').length === 32,
      'TOKEN_ENCRYPTION_KEY must be base64 that decodes to exactly 32 bytes (openssl rand -base64 32)',
    ),
});

export type Env = {
  nodeEnv: (typeof ENV_NODE_ENV)[number];
  port: number;
  mongodbUri: string;
  corsOrigins: string[];
  logLevel: (typeof ENV_LOG_LEVEL)[number];
  tokenEncryptionKey: Buffer;
};

let cachedEnv: Env | undefined;

function parseOrigins(raw: string): string[] {
  const origins = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (origins.length === 0) {
    throw new Error('CORS_ORIGINS must contain at least one origin');
  }
  return origins;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = RawEnvSchema.safeParse(source);

  if (!parsed.success) {
    const lines = parsed.error.issues.map(
      (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
    );
    const banner = [
      'Invalid environment configuration:',
      ...lines,
      'Fix the variables above (see .env.example) and start again.',
    ].join('\n');
    // stderr (not console) because the logger cannot exist before a valid env.
    process.stderr.write(`${banner}\n`);
    throw new Error('Invalid environment configuration');
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    mongodbUri: parsed.data.MONGODB_URI,
    corsOrigins: parseOrigins(parsed.data.CORS_ORIGINS),
    logLevel: parsed.data.LOG_LEVEL,
    tokenEncryptionKey: Buffer.from(parsed.data.TOKEN_ENCRYPTION_KEY, 'base64'),
  };
}

export function getEnv(): Env {
  cachedEnv ??= loadEnv();
  return cachedEnv;
}
