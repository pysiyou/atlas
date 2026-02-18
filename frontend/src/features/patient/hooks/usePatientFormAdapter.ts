/**
 * usePatientFormAdapter
 *
 * Encapsulates the field-mapping dispatch table that bridges the flat field names
 * used by legacy form section components (DemographicsSection, AddressSection, etc.)
 * to the nested React Hook Form `setValue` paths of `PatientFormInput`.
 *
 * Extracted from PatientFormTabs.tsx to separate adaptation logic from rendering.
 */

import { useCallback } from 'react';
import type { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { PatientFormInput } from '../schemas/patient.schema';

type FieldChangeHandler = (field: string, value: unknown) => void;

/**
 * Returns a stable `onFieldChange(field, value)` callback that maps flat legacy
 * field names to the correct nested `setValue` calls on the React Hook Form instance.
 */
// eslint-disable-next-line max-lines-per-function
export function usePatientFormAdapter(
  watch: UseFormWatch<PatientFormInput>,
  setValue: UseFormSetValue<PatientFormInput>
): FieldChangeHandler {
  return useCallback(
    // eslint-disable-next-line max-lines-per-function
    (field: string, value: unknown) => {
      const fieldMap: Record<string, (val: unknown) => void> = {
        fullName: val => setValue('fullName', val as string),
        dateOfBirth: val => setValue('dateOfBirth', val as string),
        gender: val => {
          if (val === 'male' || val === 'female') {
            setValue('gender', val);
          }
        },
        phone: val => setValue('phone', val as string),
        email: val => setValue('email', val as string),
        height: val =>
          setValue('height', val ? parseFloat(val as string) : undefined, {
            shouldValidate: true,
          }),
        weight: val =>
          setValue('weight', val ? parseFloat(val as string) : undefined, {
            shouldValidate: true,
          }),
        street: val => {
          const currentAddress = watch('address') || { street: '', city: '', postalCode: '' };
          setValue('address', { ...currentAddress, street: val as string }, { shouldValidate: true });
        },
        city: val => {
          const currentAddress = watch('address') || { street: '', city: '', postalCode: '' };
          setValue('address', { ...currentAddress, city: val as string }, { shouldValidate: true });
        },
        postalCode: val => {
          const currentAddress = watch('address') || { street: '', city: '', postalCode: '' };
          setValue(
            'address',
            { ...currentAddress, postalCode: val as string },
            { shouldValidate: true }
          );
        },
        // Note: hasAffiliation is handled by local state in PatientFormTabs,
        // not by setValue — the handler is injected via the `onFieldChange` wrapper there.
        affiliationDuration: val => {
          const currentAffiliation = watch('affiliation');
          setValue(
            'affiliation',
            { ...currentAffiliation, duration: val } as PatientFormInput['affiliation'],
            { shouldValidate: true }
          );
        },
        emergencyContactFullName: val => {
          const currentContact = watch('emergencyContact') || {
            fullName: '',
            relationship: 'other' as const,
            phone: '',
            email: '',
          };
          setValue(
            'emergencyContact',
            { ...currentContact, fullName: val as string },
            { shouldValidate: true }
          );
        },
        emergencyContactRelationship: val => {
          const currentContact = watch('emergencyContact') || {
            fullName: '',
            relationship: 'other' as const,
            phone: '',
            email: '',
          };
          setValue(
            'emergencyContact',
            {
              ...currentContact,
              relationship: val as PatientFormInput['emergencyContact']['relationship'],
            },
            { shouldValidate: true }
          );
        },
        emergencyContactPhone: val => {
          const currentContact = watch('emergencyContact') || {
            fullName: '',
            relationship: 'other' as const,
            phone: '',
            email: '',
          };
          setValue(
            'emergencyContact',
            { ...currentContact, phone: val as string },
            { shouldValidate: true }
          );
        },
        emergencyContactEmail: val => {
          const currentContact = watch('emergencyContact') || {
            fullName: '',
            relationship: 'other' as const,
            phone: '',
            email: '',
          };
          setValue(
            'emergencyContact',
            { ...currentContact, email: val as string },
            { shouldValidate: true }
          );
        },
        chronicConditions: val => {
          const conditions =
            typeof val === 'string'
              ? val
                  .split(';')
                  .map(s => s.trim())
                  .filter(Boolean)
              : [];
          setValue(
            'medicalHistory.chronicConditions',
            conditions.length > 0 ? conditions : undefined,
            { shouldValidate: true }
          );
        },
        currentMedications: val => {
          const medications =
            typeof val === 'string'
              ? val
                  .split(';')
                  .map(s => s.trim())
                  .filter(Boolean)
              : [];
          setValue(
            'medicalHistory.currentMedications',
            medications.length > 0 ? medications : undefined,
            { shouldValidate: true }
          );
        },
        allergies: val => {
          const allergies =
            typeof val === 'string'
              ? val
                  .split(';')
                  .map(s => s.trim())
                  .filter(Boolean)
              : [];
          setValue('medicalHistory.allergies', allergies.length > 0 ? allergies : undefined, {
            shouldValidate: true,
          });
        },
        previousSurgeries: val => {
          const surgeries =
            typeof val === 'string'
              ? val
                  .split(';')
                  .map(s => s.trim())
                  .filter(Boolean)
              : [];
          setValue(
            'medicalHistory.previousSurgeries',
            surgeries.length > 0 ? surgeries : undefined,
            { shouldValidate: true }
          );
        },
        familyHistory: val =>
          setValue('medicalHistory.familyHistory', (val as string) || undefined, {
            shouldValidate: true,
          }),
        smoking: val => {
          const currentLifestyle = watch('medicalHistory.lifestyle') || {
            smoking: false,
            alcohol: false,
          };
          setValue(
            'medicalHistory.lifestyle',
            { ...currentLifestyle, smoking: val as boolean },
            { shouldValidate: true }
          );
        },
        alcohol: val => {
          const currentLifestyle = watch('medicalHistory.lifestyle') || {
            smoking: false,
            alcohol: false,
          };
          setValue(
            'medicalHistory.lifestyle',
            { ...currentLifestyle, alcohol: val as boolean },
            { shouldValidate: true }
          );
        },
        temperature: val => {
          const currentVitals = watch('vitalSigns') || {};
          setValue(
            'vitalSigns',
            { ...currentVitals, temperature: val ? parseFloat(val as string) : undefined },
            { shouldValidate: true }
          );
        },
        heartRate: val => {
          const currentVitals = watch('vitalSigns') || {};
          setValue(
            'vitalSigns',
            { ...currentVitals, heartRate: val ? parseInt(val as string, 10) : undefined },
            { shouldValidate: true }
          );
        },
        systolicBP: val => {
          const currentVitals = watch('vitalSigns') || {};
          setValue(
            'vitalSigns',
            { ...currentVitals, systolicBP: val ? parseInt(val as string, 10) : undefined },
            { shouldValidate: true }
          );
        },
        diastolicBP: val => {
          const currentVitals = watch('vitalSigns') || {};
          setValue(
            'vitalSigns',
            { ...currentVitals, diastolicBP: val ? parseInt(val as string, 10) : undefined },
            { shouldValidate: true }
          );
        },
        respiratoryRate: val => {
          const currentVitals = watch('vitalSigns') || {};
          setValue(
            'vitalSigns',
            { ...currentVitals, respiratoryRate: val ? parseInt(val as string, 10) : undefined },
            { shouldValidate: true }
          );
        },
        oxygenSaturation: val => {
          const currentVitals = watch('vitalSigns') || {};
          setValue(
            'vitalSigns',
            { ...currentVitals, oxygenSaturation: val ? parseFloat(val as string) : undefined },
            { shouldValidate: true }
          );
        },
      };

      const handler = fieldMap[field];
      if (handler) {
        handler(value);
      }
    },
    [setValue, watch]
  );
}
