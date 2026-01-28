import { z } from 'zod';
import { dateStringSchema } from '@/shared/schemas/common.schema';

export const affiliationSchema = z.object({
  assuranceNumber: z.string().min(1),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  duration: z.union([z.literal(6), z.literal(12), z.literal(24)]),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
);

export type Affiliation = z.infer<typeof affiliationSchema>;

/** Form-only: all fields optional (partial submission allowed) */
export const affiliationFormSchema = z
  .object({
    assuranceNumber: z.string().min(1).nullish(),
    startDate: dateStringSchema.nullish(),
    endDate: dateStringSchema.nullish(),
    duration: z.union([z.literal(6), z.literal(12), z.literal(24)]).nullish(),
  })
  .refine(
    (data) =>
      !data.startDate || !data.endDate || new Date(data.endDate) > new Date(data.startDate),
    { message: 'End date must be after start date', path: ['endDate'] }
  );

export type AffiliationFormInput = z.infer<typeof affiliationFormSchema>;
