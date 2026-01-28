import { z } from 'zod';
import { nameSchema, phoneSchema, emailSchema, dateStringSchema } from '@/shared/schemas/common.schema';
import { addressSchema } from './address.schema';
import { affiliationSchema, affiliationFormSchema } from './affiliation.schema';
import { emergencyContactSchema } from './emergency-contact.schema';
import { vitalSignsSchema, vitalSignsFormSchema } from './vital-signs.schema';

export const medicalHistorySchema = z.object({
  chronicConditions: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  previousSurgeries: z.array(z.string()).optional(),
  familyHistory: z.union([z.string(), z.array(z.string())]).optional(),
  lifestyle: z.object({
    smoking: z.boolean().nullish(),
    alcohol: z.boolean().nullish(),
  }).nullish(),
});

export const patientSchema = z.object({
  id: z.number().int().positive(),
  fullName: nameSchema,
  dateOfBirth: dateStringSchema,
  gender: z.enum(['male', 'female']),
  phone: phoneSchema,
  email: emailSchema.nullable(), // Backend can return null
  height: z.number().min(30).max(250).nullable().optional(), // Backend can return null
  weight: z.number().min(1).max(500).nullable().optional(), // Backend can return null
  address: addressSchema,
  affiliation: affiliationSchema.nullable().optional(), // Backend can return null
  emergencyContact: emergencyContactSchema,
  medicalHistory: medicalHistorySchema.nullable().optional(), // Backend can return null
  vitalSigns: vitalSignsSchema.nullable().optional(), // Backend can return null
  registrationDate: dateStringSchema,
  createdBy: z.string(), // Backend returns string user ID
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
  updatedBy: z.string(), // Backend returns string user ID
});

export type Patient = z.infer<typeof patientSchema>;
export type MedicalHistory = z.infer<typeof medicalHistorySchema>;

// Form schema for CREATE (excludes auto-generated fields; all required fields enforced)
export const patientCreateSchema = patientSchema
  .omit({
    id: true,
    registrationDate: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
    updatedBy: true,
  })
  .extend({
    affiliation: affiliationFormSchema.nullish(),
    vitalSigns: vitalSignsFormSchema.nullish(),
  });

// Form schema for UPDATE (all fields optional for partial updates)
export const patientUpdateSchema = patientCreateSchema.partial();

// Legacy: keep patientFormSchema as alias to createSchema for backwards compatibility
export const patientFormSchema = patientCreateSchema;

export type PatientFormInput = z.infer<typeof patientFormSchema>;
export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;
