/**
 * PatientFormTabs
 *
 * Tab-switching shell for the patient create/edit form.
 * All React Hook Form ↔ legacy flat-field adaptation is handled by:
 *   - `usePatientFormAdapter`  → stable `onFieldChange` dispatch callback
 *   - `createFormDataAdapter`  → nested RHF state → flat object for form sections
 *   - `createErrorsAdapter`    → nested FieldErrors → flat Record<string, string>
 */

import React, { useState, useMemo } from 'react';
import type {
  UseFormRegister,
  Control,
  FieldErrors,
  UseFormWatch,
  UseFormSetValue,
} from 'react-hook-form';
import type { PatientFormInput } from '../schemas/patient.schema';
import type { Patient } from '@/types';
import { DemographicsSection } from './DemographicsSection';
import { AddressSection } from './AddressSection';
import { EmergencyContactSection } from './EmergencyContactSection';
import { AffiliationSection } from './AffiliationSection';
import { MedicalHistorySection } from './MedicalHistorySection';
import { VitalsSection } from './VitalsSection';
import { usePatientFormAdapter } from '../hooks/usePatientFormAdapter';
import { createFormDataAdapter, createErrorsAdapter } from '../utils/formTransformers';

export interface PatientFormTabsProps {
  activeTab: string;
  register: UseFormRegister<PatientFormInput>;
  control: Control<PatientFormInput>;
  errors: FieldErrors<PatientFormInput>;
  existingAffiliation?: Patient['affiliation'];
  /** When editing, vitals that were not provided show as N/A and disabled */
  existingVitalSigns?: Patient['vitalSigns'] | null;
  watch: UseFormWatch<PatientFormInput>;
  setValue: UseFormSetValue<PatientFormInput>;
}

export const PatientFormTabs: React.FC<PatientFormTabsProps> = ({
  activeTab,
  register: _register,
  control: _control,
  errors,
  existingAffiliation,
  existingVitalSigns: _existingVitalSigns,
  watch,
  setValue,
}) => {
  const initialHasAffiliation = useMemo(() => !!existingAffiliation, [existingAffiliation]);
  const [hasAffiliationChecked, setHasAffiliationChecked] = useState(initialHasAffiliation);

  // Allow editing all vital signs — users can add missing vitals during edit.
  // Empty set = no fields are read-only.
  const emptyVitalKeysReadOnly = useMemo(() => new Set<string>(), []);

  const effectiveHasAffiliation = hasAffiliationChecked || !!watch('affiliation');
  const formData = createFormDataAdapter(watch, effectiveHasAffiliation);
  const flatErrors = createErrorsAdapter(errors);

  // Base dispatch from the hook — handles all fields except `hasAffiliation`
  // (which needs local state access and cannot live in the hook).
  const baseOnFieldChange = usePatientFormAdapter(watch, setValue);

  const onFieldChange = (field: string, value: unknown) => {
    if (field === 'hasAffiliation') {
      setHasAffiliationChecked(value as boolean);
      if (!value) {
        setValue('affiliation', undefined);
      }
      return;
    }
    if (field === 'affiliationDuration' && value && !hasAffiliationChecked) {
      setHasAffiliationChecked(true);
    }
    baseOnFieldChange(field, value);
  };

  switch (activeTab) {
    case 'general':
      return (
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="pb-1">
              <div className="text-xs font-normal text-text-tertiary uppercase tracking-wide mb-1">
                General
              </div>
              <div className="text-base font-normal text-text-primary">Identity &amp; Contact</div>
            </div>
            <DemographicsSection
              formData={formData}
              errors={flatErrors}
              onFieldChange={onFieldChange}
            />
            <AddressSection formData={formData} errors={flatErrors} onFieldChange={onFieldChange} />
          </div>

          <div className="border-t border-border-default pt-6 space-y-6">
            <div className="pb-1">
              <div className="text-xs font-normal text-text-tertiary uppercase tracking-wide mb-1">
                Primary Contact
              </div>
              <div className="text-base font-normal text-text-primary">Emergency Contact</div>
            </div>
            <EmergencyContactSection
              formData={formData}
              errors={flatErrors}
              onFieldChange={onFieldChange}
            />
          </div>
        </div>
      );

    case 'medical':
      return (
        <div className="space-y-6">
          <div className="pb-1">
            <div className="text-xs font-normal text-text-tertiary uppercase tracking-wide mb-1">
              Medical Background
            </div>
            <div className="text-base font-normal text-text-primary">
              History, Conditions &amp; Lifestyle
            </div>
          </div>
          <MedicalHistorySection formData={formData} onFieldChange={onFieldChange} />
        </div>
      );

    case 'vitals':
      return (
        <div className="space-y-6">
          <div className="pb-1">
            <div className="text-xs font-normal text-text-tertiary uppercase tracking-wide mb-1">
              Vitals
            </div>
            <div className="text-base font-normal text-text-primary">Measurements</div>
            <div className="text-xs text-text-tertiary mt-1.5 leading-relaxed">
              Fill any vitals you have. Hints show typical ranges.
            </div>
          </div>
          <VitalsSection
            vitalSigns={{
              temperature: formData.temperature,
              heartRate: formData.heartRate,
              systolicBP: formData.systolicBP,
              diastolicBP: formData.diastolicBP,
              respiratoryRate: formData.respiratoryRate,
              oxygenSaturation: formData.oxygenSaturation,
            }}
            errors={flatErrors}
            onFieldChange={onFieldChange}
            emptyKeysReadOnly={emptyVitalKeysReadOnly}
          />
        </div>
      );

    case 'affiliation':
      return (
        <div className="space-y-6">
          <div className="pb-1">
            <div className="text-xs font-normal text-text-tertiary uppercase tracking-wide mb-1">
              Affiliation
            </div>
            <div className="text-base font-normal text-text-primary">Select Your Plan</div>
            <div className="text-xs text-text-tertiary mt-1.5 leading-relaxed">
              Choose a duration and pricing that works for you
            </div>
          </div>
          <AffiliationSection
            formData={formData}
            errors={flatErrors}
            onFieldChange={onFieldChange}
            existingAffiliation={existingAffiliation}
            onRenew={() => {}}
          />
        </div>
      );

    default:
      return null;
  }
};
