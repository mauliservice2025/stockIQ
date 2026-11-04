import { z } from 'zod';

export const UserItemSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  created_at: z.string().optional(),
  roles: z.array(z.string()).optional()
});

export const CreateUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be exactly 10 digits').optional(),
  roles: z.array(z.string()).default(['Viewer'])
});

export type UserItem = z.infer<typeof UserItemSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
