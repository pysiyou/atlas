import { z } from 'zod';
import { nameSchema, phoneSchema, emailSchema } from '@/shared/schemas/common.schema';

export const emergencyContactSchema = z.object({
  fullName: nameSchema,
  relationship: z.enum(['spouse', 'parent', 'sibling', 'child', 'friend', 'other']),
  phone: phoneSchema,
  email: emailSchema,
});

export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
