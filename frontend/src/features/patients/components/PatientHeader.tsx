/**
 * PatientHeader Component
 * Displays patient header with avatar and action buttons. Uses shared PageHeader for a11y and layout.
 */

import { CONTROL, INTERACTIVE, RADIUS } from '@/theme/recipes';
import { actionButtonPreset, Avatar, Icon, IconButton } from '@/components/primitives';
import { PageHeader } from '@/components/layout';
import type { Patient } from '@/types';
import { isAffiliationActive } from '../utils/patientHelpers';
import { AffiliationPopover } from './AffiliationPopover';
import { IconKeys } from '@/icons';
import { useModuleListTitles, usePanelCopy } from '@/strings';

export interface PatientHeaderProps {
  patient: Patient;
  isLarge: boolean;
  onEdit: () => void;
}

export function PatientHeader({
  patient,
  isLarge,
  onEdit,
}: PatientHeaderProps) {
  const titles = useModuleListTitles();
  const panels = usePanelCopy();
  const avatar = (
    <div className="flex items-center gap-space-2">
      <Avatar primaryText={patient.fullName} size="sm" avatarOnly />
      {isAffiliationActive(patient.affiliation) && (
        <AffiliationPopover
          affiliation={patient.affiliation}
          trigger={
            <button
              type="button"
              className={`${CONTROL.focusBrandSoft} ${RADIUS.field} flex items-center justify-center ${INTERACTIVE.clickable}`}
              aria-label={panels.patients.viewAffiliation}
              title={panels.patients.viewAffiliation}
            >
              <Icon iconKey={IconKeys.ui.verified}
                className="w-5 h-5 text-brand opacity-70 hover:opacity-100"
              />
            </button>
          }
        />
      )}
    </div>
  );
  const actions = (
    <div
      className={`flex items-center gap-space-1 ${!isLarge ? 'w-full sm:w-auto sm:justify-end justify-end' : ''}`}
    >
      <IconButton
        {...actionButtonPreset('edit')}
        size="lg"
        title={titles.editPatient}
        onClick={onEdit}
      />
    </div>
  );
  return <PageHeader title={patient.fullName} avatar={avatar} actions={actions} />;
}
