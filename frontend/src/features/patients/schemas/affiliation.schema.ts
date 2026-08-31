import { z } from 'zod';
import { dateStringSchema } from '@/types/schemas/common.schema';
import { AFFILIATION_DURATION_VALUES } from '@/types/enums';

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
