import type { FieldError, FieldErrors } from 'react-hook-form';
import type { PatientFormInput } from './schemas/patientFormSchemas';

/** Resolve a nested react-hook-form error message by dot path (e.g. `address.street`). */
export function patientFieldError(
  errors: FieldErrors<PatientFormInput>,
  path: string,
): string | undefined {
  const parts = path.split('.');
  let current: unknown = errors;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  if (current && typeof current === 'object' && 'message' in current) {
    const message = (current as FieldError).message;
    return typeof message === 'string' ? message : undefined;
  }
  return undefined;
}
