import { describe, expect, it } from 'vitest';
import type { FieldErrors } from 'react-hook-form';
import type { PatientFormInput } from './schemas/patientFormSchemas';
import {
  patientFormTabForFieldPath,
  resolveFirstPatientFormErrorPath,
} from './patientFormNavigation';

describe('patientFormTabForFieldPath', () => {
  it('maps nested paths to tabs', () => {
    expect(patientFormTabForFieldPath('emergencyContact.phone')).toBe('general');
    expect(patientFormTabForFieldPath('medicalHistory.allergies')).toBe('medical');
    expect(patientFormTabForFieldPath('vitalSigns.heartRate')).toBe('vitals');
    expect(patientFormTabForFieldPath('affiliation.duration')).toBe('affiliation');
  });
});

describe('resolveFirstPatientFormErrorPath', () => {
  it('returns first nested path with a message', () => {
    const errors: FieldErrors<PatientFormInput> = {
      address: {
        street: { type: 'custom', message: 'Street is required' },
      },
      fullName: { type: 'custom', message: 'Name required' },
    };
    expect(resolveFirstPatientFormErrorPath(errors)).toBe('address.street');
  });
});
