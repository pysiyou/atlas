/**
 * Patient context on order detail — same read-only blocks as the patient detail page.
 */

import React from 'react';
import { text, FG } from '@/theme/recipes';
import { Icon } from '@/components/primitives';
import { ICONS } from '@/config/icons';
import type { Patient } from '@/types';
import { GeneralInfoSection } from '@/features/patients/components/GeneralInfoSection';
import { MedicalHistorySectionDisplay } from '@/features/patients/components/MedicalHistorySectionDisplay';
import { CareSnapshotSection } from '@/features/patients/components/CareSnapshotSection';

export interface PatientInfoSectionProps {
  patient: Patient | null;
  onViewPatient?: () => void;
}

export const PatientInfoSection: React.FC<PatientInfoSectionProps> = ({
  patient,
  onViewPatient: _onViewPatient,
}) => {
  if (!patient) {
    return (
      <div className="flex items-center justify-center h-full min-h-50">
        <div className="text-center">
          <Icon
            name={ICONS.dataFields.user}
            className={`w-12 h-12 ${FG.disabled} mx-auto mb-space-2`}
          />
          <p className={text({ role: 'amount', intent: 'muted' })}>Patient Not Found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 h-full flex-col gap-layout-section">
      <GeneralInfoSection patient={patient} />
      <MedicalHistorySectionDisplay patient={patient} />
      <CareSnapshotSection patient={patient} />
    </div>
  );
};
