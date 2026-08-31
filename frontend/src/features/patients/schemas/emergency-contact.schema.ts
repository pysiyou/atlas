import { z } from 'zod';
import { nameSchema, phoneSchema, emailSchema } from '@/types/schemas/common.schema';
import { RELATIONSHIP_VALUES } from '@/types/enums';

export const emergencyContactSchema = z.object({
  fullName: nameSchema,
  relationship: z.enum(RELATIONSHIP_VALUES),
  phone: phoneSchema,
  email: emailSchema,
});

export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
