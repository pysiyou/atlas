import { z } from 'zod';
import { nameSchema, phoneSchema, emailSchema } from '@/shared/schemas/common.schema';

export const emergencyContactSchema = z.object({
  fullName: nameSchema,
  relationship: z.enum(['self', 'spouse', 'parent', 'sibling', 'child', 'grandparent', 'grandchild', 'other-relative', 'guardian', 'friend', 'other']),
  phone: phoneSchema,
  email: emailSchema,
});

export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
