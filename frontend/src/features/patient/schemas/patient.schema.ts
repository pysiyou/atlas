import { z } from 'zod';
import { nameSchema, phoneSchema, emailSchema, dateStringSchema } from '@/shared/schemas/common.schema';
import { addressSchema } from './address.schema';
import { affiliationSchema } from './affiliation.schema';
import { emergencyContactSchema } from './emergency-contact.schema';
import { vitalSignsSchema } from './vital-signs.schema';

export const medicalHistorySchema = z.object({
  chronicConditions: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  previousSurgeries: z.array(z.string()).optional(),
  familyHistory: z.union([z.string(), z.array(z.string())]).optional(),
  lifestyle: z.object({
    smoking: z.boolean(),
    alcohol: z.boolean(),
  }).optional(),
});

export const patientSchema = z.object({
  id: z.number().int().positive(),
  fullName: nameSchema,
  dateOfBirth: dateStringSchema,
  gender: z.enum(['male', 'female']),
  phone: phoneSchema,
  email: emailSchema,
  height: z.number().min(30).max(250).optional(),
  weight: z.number().min(1).max(500).optional(),
  address: addressSchema,
  affiliation: affiliationSchema.optional(),
  emergencyContact: emergencyContactSchema,
  medicalHistory: medicalHistorySchema.optional(),
  vitalSigns: vitalSignsSchema.optional(),
  registrationDate: dateStringSchema,
  createdBy: z.number().int().positive(),
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
  updatedBy: z.number().int().positive(),
});

export type Patient = z.infer<typeof patientSchema>;
export type MedicalHistory = z.infer<typeof medicalHistorySchema>;

// Form schema (excludes auto-generated fields)
export const patientFormSchema = patientSchema.omit({
  id: true,
  registrationDate: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  updatedBy: true,
});

export type PatientFormInput = z.infer<typeof patientFormSchema>;
