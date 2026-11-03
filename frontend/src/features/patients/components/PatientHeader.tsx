/**
 * PatientHeader Component
 * Displays patient header with avatar and action buttons. Uses shared PageHeader for a11y and layout.
 */

import React from 'react';
import { CONTROL, INTERACTIVE, RADIUS } from '@/theme/recipes';
import { actionButtonPreset, Avatar, Icon, IconButton } from '@/components/primitives';
import { PageHeader } from '@/components/layout';
import type { Patient } from '@/types/patient';
import { isAffiliationActive } from '../utils/patientHelpers';
import { AffiliationPopover } from './AffiliationPopover';
import { IconKeys } from '@/config/icons';

export interface PatientHeaderProps {
  patient: Patient;
  isLarge: boolean;
  onEdit: () => void;
  onNewOrder: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  isLarge,
  onEdit,
  onNewOrder,
}) => {
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
              aria-label="View affiliation details"
              title="View affiliation details"
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
      <IconButton {...actionButtonPreset('edit')} size="lg" title="Edit Patient" onClick={onEdit} />
      <IconButton {...actionButtonPreset('add')} size="lg" title="New Order" onClick={onNewOrder} />
    </div>
  );
  return <PageHeader title={patient.fullName} avatar={avatar} actions={actions} />;
};
