/**
 * Patient context on order detail — single field list; panel body provides scrolling.
 */

import { useMemo } from 'react';
import { text, FG } from '@/theme/recipes';
import { Icon } from '@/components/primitives';
import { IconKeys } from '@/icons';
import type { Patient } from '@/types';
import { DETAIL_SECTION_GENERAL_INFO_GRID } from '@/components/display';

import { renderGeneralInfoDescriptionItems } from '@/features/patients';

export interface PatientInfoSectionProps {
  patient: Patient | null;
  onViewPatient?: () => void;
}

export function PatientInfoSection({
  patient,
  onViewPatient: _onViewPatient,
}: PatientInfoSectionProps) {
  const infoItems = useMemo(
    () => (patient ? renderGeneralInfoDescriptionItems(patient) : []),
    [patient]
  );

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-50">
        <div className="text-center">
          <Icon iconKey={IconKeys.dataFields.user}
            className={`w-12 h-12 ${FG.disabled} mx-auto mb-space-2`}
          />
          <p className={text({ role: 'amount', intent: 'muted' })}>Patient Not Found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className={DETAIL_SECTION_GENERAL_INFO_GRID}>{infoItems}</div>
      </div>
    </div>
  );
}
