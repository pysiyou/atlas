/** Patient form Zod schemas (address, affiliation, emergency contact, patient). */
import { z } from 'zod';
import {
  nameSchema,
  phoneSchema,
  emailSchema,
  dateStringSchema,
  postalCodeSchema,
} from '@/types/schemas/common.schema';
import { AFFILIATION_DURATION_VALUES, GENDER_VALUES, RELATIONSHIP_VALUES } from '@/types/enums';
import { zEnumFromValues } from '@/types/schemas/enumFromValues';
import { getClientConfig } from '@/config/clientConfig';

export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: postalCodeSchema,
});

export type Address = z.infer<typeof addressSchema>;

const affiliationDurationSchema = z.custom<number>(
  val =>
    typeof val === 'number' &&
    (AFFILIATION_DURATION_VALUES as readonly number[]).includes(val),
  { message: 'Invalid affiliation duration' }
);

export const affiliationSchema = z
  .object({
    assuranceNumber: z.string().min(1),
    startDate: dateStringSchema,
    endDate: dateStringSchema,
    duration: affiliationDurationSchema,
  })
  .refine(data => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export type Affiliation = z.infer<typeof affiliationSchema>;

/** Form-only: all fields optional (partial submission allowed) */
export const affiliationFormSchema = z
  .object({
    assuranceNumber: z.string().min(1).nullish(),
    startDate: dateStringSchema.nullish(),
    endDate: dateStringSchema.nullish(),
    duration: affiliationDurationSchema.nullish(),
  })
  .refine(
    data => !data.startDate || !data.endDate || new Date(data.endDate) > new Date(data.startDate),
    { message: 'End date must be after start date', path: ['endDate'] }
  );

export type AffiliationFormInput = z.infer<typeof affiliationFormSchema>;

export const emergencyContactSchema = z.object({
  fullName: nameSchema,
  relationship: zEnumFromValues(RELATIONSHIP_VALUES),
  phone: phoneSchema,
  email: emailSchema,
});

export type EmergencyContact = z.infer<typeof emergencyContactSchema>;

/** Backend PatientResponse allows legacy phones shorter than the write minimum. */
const patientReadPhoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .max(20, 'Phone number must be at most 20 characters')
  .regex(/^[\d\s\-+()]+$/, 'Invalid phone number format');

const emergencyContactReadSchema = emergencyContactSchema.extend({
  phone: patientReadPhoneSchema,
});

export const medicalHistorySchema = z.object({
  chronicConditions: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  previousSurgeries: z.array(z.string()).optional(),
  familyHistory: z.union([z.string(), z.array(z.string())]).optional(),
  lifestyle: z
    .object({
      smoking: z.boolean().nullish(),
      alcohol: z.boolean().nullish(),
    })
    .nullish(),
});

export const patientSchema = z.object({
  id: z.number().int().positive(),
  fullName: nameSchema,
  dateOfBirth: dateStringSchema,
  gender: zEnumFromValues(GENDER_VALUES),
  phone: patientReadPhoneSchema,
  email: emailSchema.nullable(), // Backend can return null
  height: z.number().min(30).max(250).nullable().optional(), // Backend can return null
  weight: z.number().min(1).max(500).nullable().optional(), // Backend can return null
  address: addressSchema,
  affiliation: affiliationSchema.nullable().optional(), // Backend can return null
  emergencyContact: emergencyContactReadSchema,
  medicalHistory: medicalHistorySchema.nullable().optional(), // Backend can return null
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
    phone: phoneSchema,
    emergencyContact: emergencyContactSchema.partial(),
    affiliation: affiliationFormSchema.nullish(),
  })
  .superRefine((data, ctx) => {
    const requireEmergency =
      getClientConfig()?.workflows?.requireEmergencyContact !== false;
    if (!requireEmergency) return;
    const ec = data.emergencyContact;
    if (!ec?.fullName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['emergencyContact', 'fullName'],
        message: 'Emergency contact name is required',
      });
    }
    if (!ec?.phone?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['emergencyContact', 'phone'],
        message: 'Emergency contact phone is required',
      });
    }
  });

// Form schema for UPDATE (all fields optional for partial updates)
export const patientUpdateSchema = patientCreateSchema.partial();

export type PatientFormInput = z.infer<typeof patientCreateSchema>;
export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

