
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(1),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;
