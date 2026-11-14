import { z } from 'zod';

export const startGithubConnectionSchema = z.strictObject({
  returnTo: z
    .string()
    .trim()
    .max(200)
    .regex(/^\/(?!\/)[^\s\\]*$/, 'returnTo must be an app-relative path')
    .default('/projects'),
});

export type StartGithubConnectionInput = z.infer<typeof startGithubConnectionSchema>;

export const githubConnectionCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});
