/**
 * PatientHeader Component
 * Displays patient header with avatar and action buttons. Uses shared PageHeader for a11y and layout.
 */

import React from 'react';
import { CONTROL, RADIUS } from '@/components/theme/recipes';
import { actionButtonPreset, Button, Avatar, Icon, IconButton } from '@/components';
import { PageHeader } from '@/components';
import type { Patient } from '@/types/patient';
import { isAffiliationActive } from '../utils/patientHelpers';
import { AffiliationPopover } from './AffiliationPopover';
import { ICONS } from '@/config/icons';

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
              className={`${CONTROL.focusBrandSoft} ${RADIUS.field} flex items-center justify-center`}
              aria-label="View affiliation details"
              title="View affiliation details"
            >
              <Icon
                name={ICONS.ui.verified}
                className="w-5 h-5 text-brand opacity-70 hover:opacity-100 cursor-pointer"
              />
            </button>
          }
        />
      )}
    </div>
  );
  const actions = (
    <div
      className={`flex items-center gap-space-2 ${!isLarge ? 'w-full sm:w-auto sm:justify-end justify-end' : ''}`}
    >
      {isLarge ? (
        <>
          <Button {...actionButtonPreset('edit')} size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button {...actionButtonPreset('add')} size="sm" onClick={onNewOrder}>
            New Order
          </Button>
        </>
      ) : (
        <>
          <IconButton {...actionButtonPreset('edit')} size="sm" title="Edit Patient" onClick={onEdit} />
          <IconButton {...actionButtonPreset('add')} size="sm" title="New Order" onClick={onNewOrder} />
        </>
      )}
    </div>
  );
  return <PageHeader title={patient.fullName} avatar={avatar} actions={actions} />;
};
