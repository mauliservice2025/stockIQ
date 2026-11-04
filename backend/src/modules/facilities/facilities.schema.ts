import { z } from 'zod';

export const FacilitySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  organization_id: z.string().optional(),
  is_active: z.boolean().default(true),
  address: z.string().optional()
});

export type Facility = z.infer<typeof FacilitySchema>;
