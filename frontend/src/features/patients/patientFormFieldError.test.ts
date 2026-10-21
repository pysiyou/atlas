import { describe, expect, it } from 'vitest';
import type { FieldErrors } from 'react-hook-form';
import type { PatientFormInput } from './schemas/patientFormSchemas';
import { patientFieldError } from './patientFormFieldError';

describe('patientFieldError', () => {
  it('reads nested error messages', () => {
    const errors: FieldErrors<PatientFormInput> = {
      emergencyContact: {
        phone: { type: 'custom', message: 'Invalid phone' },
      },
    };
    expect(patientFieldError(errors, 'emergencyContact.phone')).toBe('Invalid phone');
    expect(patientFieldError(errors, 'fullName')).toBeUndefined();
  });
});
