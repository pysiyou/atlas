import { z } from 'zod';

/** Full vital signs schema - all fields required (for API responses) */
export const vitalSignsSchema = z.object({
  temperature: z.number().min(30).max(45),
  heartRate: z.number().int().min(30).max(250),
  systolicBP: z.number().int().min(50).max(250),
  diastolicBP: z.number().int().min(30).max(150),
  respiratoryRate: z.number().int().min(4).max(60),
  oxygenSaturation: z.number().min(50).max(100),
}).refine(
  (data) => data.systolicBP > data.diastolicBP,
  { message: 'Systolic must be greater than diastolic', path: ['systolicBP'] }
);

/** Form vital signs schema - all fields optional (partial submission allowed) */
export const vitalSignsFormSchema = z.object({
  temperature: z.number().min(30).max(45).optional(),
  heartRate: z.number().int().min(30).max(250).optional(),
  systolicBP: z.number().int().min(50).max(250).optional(),
  diastolicBP: z.number().int().min(30).max(150).optional(),
  respiratoryRate: z.number().int().min(4).max(60).optional(),
  oxygenSaturation: z.number().min(50).max(100).optional(),
}).refine(
  (data) => {
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
