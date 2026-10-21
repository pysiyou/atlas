import { z } from 'zod';
import { USER_ROLE_VALUES } from '@/types/enums';

export const userUpsertFormSchema = z.object({
  username: z.string(),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(USER_ROLE_VALUES),
  email: z.string(),
  phone: z.string(),
  password: z.string(),
});

export type UserUpsertFormInput = z.infer<typeof userUpsertFormSchema>;
