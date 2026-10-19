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
import type { PatientFormInput } from '../schemas/patientFormSchemas';
import type { Patient } from '@/types';
import { DemographicsSection } from './DemographicsSection';
import { AddressSection } from './AddressSection';
import { EmergencyContactSection } from './EmergencyContactSection';
import { AffiliationSection } from './AffiliationSection';
import { MedicalHistorySection } from './MedicalHistorySection';
import { VitalsSection } from './VitalsSection';
import { Panel } from '@/components/surfaces';
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
        <div className="space-y-space-6">
          <Panel title="Identity & Contact" scroll="visible" spacing="normal">
            <DemographicsSection
              formData={formData}
              errors={flatErrors}
              onFieldChange={onFieldChange}
            />
            <AddressSection formData={formData} errors={flatErrors} onFieldChange={onFieldChange} />
          </Panel>
          <Panel title="Emergency Contact" scroll="visible" spacing="normal">
            <EmergencyContactSection
              formData={formData}
              errors={flatErrors}
              onFieldChange={onFieldChange}
            />
          </Panel>
        </div>
      );

    case 'medical':
      return (
        <Panel title="History, Conditions & Lifestyle" scroll="visible" spacing="normal">
          <MedicalHistorySection formData={formData} onFieldChange={onFieldChange} />
        </Panel>
      );

    case 'vitals':
      return (
        <Panel
          title="Measurements"
          meta="Fill any vitals you have. Hints show typical ranges."
          scroll="visible"
          spacing="normal"
        >
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
        </Panel>
      );

    case 'affiliation':
      return (
        <Panel
          title="Select Your Plan"
          meta="Choose a duration and pricing that works for you"
          scroll="visible"
          spacing="normal"
        >
          <AffiliationSection
            formData={formData}
            errors={flatErrors}
            onFieldChange={onFieldChange}
            existingAffiliation={existingAffiliation}
            onRenew={() => {}}
          />
        </Panel>
      );

    default:
      return null;
  }
};
