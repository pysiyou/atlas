/**
 * PatientFormTabs — tab shell for patient create/edit; sections bind React Hook Form directly.
 */

import React, { useState, useMemo } from 'react';
import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import type { PatientFormInput } from '../schemas/patientFormSchemas';
import type { Patient } from '@/types';
import { DemographicsSection } from './DemographicsSection';
import { AddressSection } from './AddressSection';
import { EmergencyContactSection } from './EmergencyContactSection';
import { AffiliationSection } from './AffiliationSection';
import { MedicalHistorySection } from './MedicalHistorySection';
import { VitalsSection } from './VitalsSection';
import { Panel } from '@/components/surfaces';

export interface PatientFormTabsProps {
  activeTab: string;
  control: Control<PatientFormInput>;
  errors: FieldErrors<PatientFormInput>;
  setValue: UseFormSetValue<PatientFormInput>;
  existingAffiliation?: Patient['affiliation'];
}

export const PatientFormTabs: React.FC<PatientFormTabsProps> = ({
  activeTab,
  control,
  errors,
  setValue,
  existingAffiliation,
}) => {
  const initialHasAffiliation = useMemo(() => !!existingAffiliation, [existingAffiliation]);
  const [affiliationEnabled, setAffiliationEnabled] = useState(initialHasAffiliation);

  const emptyVitalKeysReadOnly = useMemo(() => new Set<string>(), []);

  switch (activeTab) {
    case 'general':
      return (
        <div className="space-y-space-6">
          <Panel preset="panel.page.form" title="Identity & Contact">
            <DemographicsSection control={control} errors={errors} />
            <AddressSection control={control} errors={errors} />
          </Panel>
          <Panel preset="panel.page.form" title="Emergency Contact">
            <EmergencyContactSection control={control} errors={errors} />
          </Panel>
        </div>
      );

    case 'medical':
      return (
        <Panel preset="panel.page.form" title="History, Conditions & Lifestyle">
          <MedicalHistorySection control={control} errors={errors} />
        </Panel>
      );

    case 'vitals':
      return (
        <Panel
          preset="panel.page.form"
          title="Measurements"
          meta="Fill any vitals you have. Hints show typical ranges."
        >
          <VitalsSection
            control={control}
            errors={errors}
            emptyKeysReadOnly={emptyVitalKeysReadOnly}
          />
        </Panel>
      );

    case 'affiliation':
      return (
        <Panel
          preset="panel.page.form"
          title="Select Your Plan"
          meta="Choose a duration and pricing that works for you"
        >
          <AffiliationSection
            control={control}
            errors={errors}
            setValue={setValue}
            existingAffiliation={existingAffiliation}
            affiliationEnabled={affiliationEnabled}
            onAffiliationEnabledChange={setAffiliationEnabled}
            onRenew={() => setAffiliationEnabled(true)}
          />
        </Panel>
      );

    default:
      return null;
  }
};
