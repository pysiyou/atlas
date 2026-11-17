import { z } from 'zod';
import { emailSchema, nameSchema, phoneSchema, referentDoctorIdSchema } from '@/types/zod';

export const referentDoctorResponseSchema = z.object({
  referentDoctorId: referentDoctorIdSchema,
  fullName: z.string().min(1),
  username: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  hospitalName: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const referentDoctorCreateSchema = z.object({
  fullName: nameSchema,
  referentDoctorId: referentDoctorIdSchema.nullable().optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(100)
    .nullable()
    .optional(),
  email: emailSchema.nullable().optional(),
  phone: phoneSchema.nullable().optional(),
  hospitalName: z.string().max(200).nullable().optional(),
});

export type ReferentDoctorValidated = z.infer<typeof referentDoctorResponseSchema>;
export type ReferentDoctorCreateValidated = z.infer<typeof referentDoctorCreateSchema>;