import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { z } from 'zod';

/**
 * Validate a route param against a Zod string schema; redirect on failure.
 */
export function useClinicalRouteParam(
  value: string | undefined,
  schema: z.ZodType<string>,
  redirectTo: string,
): string | undefined {
  const navigate = useNavigate();
  const parsed = useMemo(() => {
    if (!value) return undefined;
    const result = schema.safeParse(value.trim());
    return result.success ? result.data : undefined;
  }, [value, schema]);

  useEffect(() => {
    if (value !== undefined && parsed === undefined) {
      navigate(redirectTo, { replace: true });
    }
  }, [value, parsed, navigate, redirectTo]);

  return parsed;
}