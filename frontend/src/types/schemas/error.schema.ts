import { z } from 'zod';

/** Field-level validation detail from backend ErrorResponse.details */
export const apiErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
});

export type ApiErrorDetail = z.infer<typeof apiErrorDetailSchema>;

/** Unified API error — aligns with backend ErrorResponse */
export const apiErrorSchema = z.object({
  message: z.string(),
  /** Machine-readable code (maps from backend error_code) */
  code: z.string().optional(),
  field: z.string().optional(),
  status: z.number().optional(),
  details: z.array(apiErrorDetailSchema).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
