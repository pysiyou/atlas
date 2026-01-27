import { z } from 'zod';

export const testParameterSchema = z.object({
  parameterCode: z.string(),
  parameterName: z.string(),
  value: z.union([z.string(), z.number()]),
  unit: z.string().optional(),
  referenceRange: z.string().optional(),
  flags: z.array(z.string()).optional(),
  status: z.enum(['normal', 'high', 'low', 'critical']).optional(),
});

export const testResultSchema = z.object({
  testCode: z.string(),
  parameters: z.array(testParameterSchema),
  technicianNotes: z.string().optional(),
  validationNotes: z.string().optional(),
  enteredBy: z.number().int().positive().optional(),
  validatedBy: z.number().int().positive().optional(),
  enteredAt: z.string().datetime().optional(),
  validatedAt: z.string().datetime().optional(),
});

export type TestParameter = z.infer<typeof testParameterSchema>;
export type TestResult = z.infer<typeof testResultSchema>;
