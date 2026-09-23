/** Patient form Zod schemas (address, affiliation, emergency contact, vitals, patient). */
import { z } from 'zod';
import {
  nameSchema,
  phoneSchema,
  emailSchema,
  dateStringSchema,
  postalCodeSchema,
} from '@/types/schemas/common.schema';
import { AFFILIATION_DURATION_VALUES, RELATIONSHIP_VALUES } from '@/types/enums';

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
  relationship: z.enum(RELATIONSHIP_VALUES),
  phone: phoneSchema,
  email: emailSchema,
});

export type EmergencyContact = z.infer<typeof emergencyContactSchema>;


/** Response vital signs schema - all fields optional/nullable (backend returns partial data) */
export const vitalSignsSchema = z
  .object({
    temperature: z.number().min(30).max(45).nullable().optional(),
    heartRate: z.number().int().min(30).max(250).nullable().optional(),
    systolicBP: z.number().int().min(50).max(250).nullable().optional(),
    diastolicBP: z.number().int().min(30).max(150).nullable().optional(),
    respiratoryRate: z.number().int().min(4).max(60).nullable().optional(),
    oxygenSaturation: z.number().min(50).max(100).nullable().optional(),
  })
  .refine(
    data => {
      // If both BP values are provided, systolic must be greater than diastolic
      if (
        data.systolicBP !== undefined &&
        data.systolicBP !== null &&
        data.diastolicBP !== undefined &&
        data.diastolicBP !== null
      ) {
        return data.systolicBP > data.diastolicBP;
      }
      return true;
    },
    { message: 'Systolic must be greater than diastolic', path: ['systolicBP'] }
  );

/** Form vital signs schema - all fields optional (partial submission allowed) */
export const vitalSignsFormSchema = z
  .object({
    temperature: z.number().min(30).max(45).optional(),
    heartRate: z.number().int().min(30).max(250).optional(),
    systolicBP: z.number().int().min(50).max(250).optional(),
    diastolicBP: z.number().int().min(30).max(150).optional(),
    respiratoryRate: z.number().int().min(4).max(60).optional(),
    oxygenSaturation: z.number().min(50).max(100).optional(),
  })
  .refine(
    data => {
      // If both BP values are provided, systolic must be greater than diastolic
      if (data.systolicBP !== undefined && data.diastolicBP !== undefined) {
        return data.systolicBP > data.diastolicBP;
      }
      return true;
    },
    { message: 'Systolic must be greater than diastolic', path: ['systolicBP'] }
  );

export type VitalSigns = z.infer<typeof vitalSignsSchema>;
export type VitalSignsFormInput = z.infer<typeof vitalSignsFormSchema>;

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
  gender: z.enum(['male', 'female']),
  phone: patientReadPhoneSchema,
  email: emailSchema.nullable(), // Backend can return null
  height: z.number().min(30).max(250).nullable().optional(), // Backend can return null
  weight: z.number().min(1).max(500).nullable().optional(), // Backend can return null
  address: addressSchema,
  affiliation: affiliationSchema.nullable().optional(), // Backend can return null
  emergencyContact: emergencyContactReadSchema,
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
    phone: phoneSchema,
    emergencyContact: emergencyContactSchema,
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

