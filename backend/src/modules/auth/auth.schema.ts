import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required')
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
    plantId: z.string().optional(),
    plantName: z.string().optional()
  })
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
