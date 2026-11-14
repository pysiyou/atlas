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

const affiliationFormFieldsSchema = z.object({
  assuranceNumber: z.string().min(1).nullish(),
  startDate: dateStringSchema.nullish(),
  endDate: dateStringSchema.nullish(),
  duration: affiliationDurationSchema.nullish(),
});

/** Form-only: all fields optional (partial submission allowed) */
export const affiliationFormSchema = affiliationFormFieldsSchema.refine(
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

/** Optional emergency contact on write when workflow does not require it. */
const emergencyContactFormSchema = z.object({
  fullName: nameSchema.optional(),
  relationship: zEnumFromValues(RELATIONSHIP_VALUES).optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
});

function refineAffiliationDates(
  affiliation: z.infer<typeof affiliationFormFieldsSchema> | null | undefined,
  ctx: z.RefinementCtx,
): void {
  if (!affiliation?.startDate || !affiliation?.endDate) return;
  if (new Date(affiliation.endDate) <= new Date(affiliation.startDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['affiliation', 'endDate'],
      message: 'End date must be after start date',
    });
  }
}

function refineEmergencyContactRequired(
  emergencyContact: z.infer<typeof emergencyContactFormSchema> | undefined,
  ctx: z.RefinementCtx,
): void {
  const requireEmergency =
    getClientConfig()?.workflows?.requireEmergencyContact !== false;
  if (!requireEmergency) return;
  if (!emergencyContact?.fullName?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['emergencyContact', 'fullName'],
      message: 'Emergency contact name is required',
    });
  }
  if (!emergencyContact?.phone?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['emergencyContact', 'phone'],
      message: 'Emergency contact phone is required',
    });
  }
}

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

/** Shared patient form fields (no refinements — safe to call `.partial()` on). */
const patientFormFieldsSchema = patientSchema
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
    emergencyContact: emergencyContactFormSchema,
    affiliation: affiliationFormFieldsSchema.nullish(),
  });

// Form schema for CREATE (excludes auto-generated fields; all required fields enforced)
export const patientCreateSchema = patientFormFieldsSchema.superRefine((data, ctx) => {
  refineAffiliationDates(data.affiliation, ctx);
  refineEmergencyContactRequired(data.emergencyContact, ctx);
});

// Form schema for UPDATE (all fields optional for partial updates)
export const patientUpdateSchema = patientFormFieldsSchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.affiliation !== undefined) {
      refineAffiliationDates(data.affiliation, ctx);
    }
    if (data.emergencyContact !== undefined) {
      refineEmergencyContactRequired(data.emergencyContact, ctx);
    }
  });

export type PatientFormInput = z.infer<typeof patientCreateSchema>;
export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

