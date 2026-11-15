/**
 * PatientFormTabs — tab shell for patient create/edit; sections bind React Hook Form directly.
 */

import { useState, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import type { PatientFormInput } from '../schemas/patientFormSchemas';
import type { Patient } from '@/types';
import { DemographicsSection } from './DemographicsSection';
import { AddressSection } from './AddressSection';
import { EmergencyContactSection } from './EmergencyContactSection';
import { AffiliationSection } from './AffiliationSection';
import { MedicalHistorySection } from './MedicalHistorySection';
import { Panel } from '@/components/surfaces';
import { usePanelCopy } from '@/strings';

export interface PatientFormTabsProps {
  activeTab: string;
  existingAffiliation?: Patient['affiliation'];
}

export function PatientFormTabs({
  activeTab,
  existingAffiliation,
}: PatientFormTabsProps) {
  const { setValue } = useFormContext<PatientFormInput>();
  const panels = usePanelCopy();
  const initialHasAffiliation = useMemo(() => !!existingAffiliation, [existingAffiliation]);
  const [affiliationEnabled, setAffiliationEnabled] = useState(initialHasAffiliation);

  switch (activeTab) {
    case 'general':
      return (
        <div className="space-y-space-6">
          <Panel preset="panel.page.form" title={panels.patients.identityContact}>
            <DemographicsSection />
            <AddressSection />
          </Panel>
          <Panel preset="panel.page.form" title={panels.patients.emergencyContact}>
            <EmergencyContactSection />
          </Panel>
        </div>
      );

    case 'medical':
      return (
        <Panel preset="panel.page.form" title={panels.patients.historyConditionsLifestyle}>
          <MedicalHistorySection />
        </Panel>
      );

    case 'affiliation':
      return (
        <Panel
          preset="panel.page.form"
          title={panels.patients.selectPlan}
          meta="Choose a duration and pricing that works for you"
        >
          <AffiliationSection
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
}
