import { useState, useCallback } from 'react';
import { z } from 'zod';

export interface UseFormWithValidationReturn<T> {
  data: T;
  errors: Record<string, string>;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  validate: () => boolean;
  reset: () => void;
  setData: (data: T) => void;
  hasErrors: boolean;
  isFieldValid: (field: keyof T) => boolean;
}

/**
 * Generic form hook with Zod schema validation
 * Replaces manual validation with declarative schemas
 * 
 * @example
 * ```typescript
 * const patientSchema = z.object({
 *   fullName: z.string().min(1, 'Full name is required'),
 *   email: z.string().email('Invalid email'),
 * });
 * 
 * const form = useFormWithValidation(patientSchema, initialData);
 * ```
 */
export function useFormWithValidation<T extends z.ZodSchema>(
  schema: T,
  initialData?: z.infer<T>
): UseFormWithValidationReturn<z.infer<T>> {
  type FormData = z.infer<T>;
  
  const getInitialData = (): FormData => {
    if (initialData) return initialData;
    // Create empty object matching schema shape
    const shape = (schema as any)._def.shape?.();
    if (!shape) return {} as FormData;
    
    const empty: any = {};
    Object.keys(shape).forEach(key => {
      empty[key] = '';
    });
    return empty;
  };

  const [data, setData] = useState<FormData>(getInitialData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setData(prev => ({ ...prev as object, [field]: value } as FormData));
    
    // Clear field error on change
    if (errors[field as string]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  }, [errors]);

  const validate = useCallback((): boolean => {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  }, [data, schema]);

  const reset = useCallback(() => {
    setData(getInitialData());
    setErrors({});
  }, [initialData, schema]);

  const isFieldValid = useCallback((field: keyof FormData) => {
    return !errors[field as string];
  }, [errors]);

  return {
    data,
    errors,
    updateField,
    validate,
    reset,
    setData,
    hasErrors: Object.keys(errors).length > 0,
    isFieldValid,
  };
}
