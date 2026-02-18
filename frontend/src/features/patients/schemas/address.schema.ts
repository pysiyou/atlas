import { z } from 'zod';
import { postalCodeSchema } from '@/types/schemas/common.schema';

export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: postalCodeSchema,
});

export type Address = z.infer<typeof addressSchema>;
