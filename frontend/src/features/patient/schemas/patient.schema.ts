import { z } from 'zod';
import { nameSchema, phoneSchema, emailSchema, dateStringSchema } from '@/shared/schemas/common.schema';
import { addressSchema } from './address.schema';
import { affiliationSchema, affiliationFormSchema } from './affiliation.schema';
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
  vitalSigns: vitalSignsSchema.nullable().optional(),
  registrationDate: dateStringSchema,
  createdBy: z.string(), // Backend returns string user ID
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
  updatedBy: z.string(), // Backend returns string user ID
});

export type Patient = z.infer<typeof patientSchema>;
export type MedicalHistory = z.infer<typeof medicalHistorySchema>;

// Form schema (excludes auto-generated fields; form uses partial affiliation)
export const patientFormSchema = patientSchema
  .omit({
    id: true,
    registrationDate: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
    updatedBy: true,
  })
  .extend({ affiliation: affiliationFormSchema.optional() });

export type PatientFormInput = z.infer<typeof patientFormSchema>;
