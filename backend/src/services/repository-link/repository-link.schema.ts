import { z } from 'zod';

const BRANCH_PATTERN = /^[A-Za-z0-9._/-]+$/;

function isSafeBranchName(value: string): boolean {
  return (
    !value.includes('..') &&
    !value.includes('//') &&
    !value.startsWith('/') &&
    !value.endsWith('/') &&
    !value.split('/').some((segment) => segment.startsWith('.'))
  );
}

export const connectRepositorySchema = z.strictObject({
  url: z.url().max(200),
  branch: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(BRANCH_PATTERN)
    .refine(isSafeBranchName),
});

export type ConnectRepositoryInput = z.infer<typeof connectRepositorySchema>;