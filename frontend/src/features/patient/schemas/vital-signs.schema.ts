import { z } from 'zod';

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

export type VitalSigns = z.infer<typeof vitalSignsSchema>;
