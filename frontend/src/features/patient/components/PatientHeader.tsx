/**
 * PatientHeader Component
 * Displays patient header with avatar and action buttons. Uses shared DetailPageHeader for a11y and layout.
 */

import React from 'react';
import { Button, Avatar, Icon, IconButton } from '@/shared/ui';
import { DetailPageHeader } from '@/shared/components';
import type { Patient } from '@/types/patient';
import { usePatientService } from '../services/usePatientService';
import { AffiliationPopover } from './AffiliationPopover';
import { ICONS } from '@/utils';

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
  const { isAffiliationActive } = usePatientService();
  const avatar = (
    <div className="flex items-center gap-2">
      <Avatar primaryText={patient.fullName} size="sm" />
      {isAffiliationActive(patient.affiliation) && (
        <AffiliationPopover
          affiliation={patient.affiliation}
          trigger={
            <button
              className="focus:outline-none focus:ring-2 focus:ring-brand/20 rounded flex items-center justify-center"
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
      className={`flex items-center gap-2 ${!isLarge ? 'w-full sm:w-auto sm:justify-end justify-end' : ''}`}
    >
      {isLarge ? (
        <>
          <Button variant="edit" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="add" size="sm" onClick={onNewOrder}>
            New Order
          </Button>
        </>
      ) : (
        <>
          <IconButton variant="edit" size="sm" title="Edit Patient" onClick={onEdit} />
          <IconButton variant="add" size="sm" title="New Order" onClick={onNewOrder} />
        </>
      )}
    </div>
  );
  return (
    <DetailPageHeader
      title={patient.fullName}
      avatar={avatar}
      actions={actions}
    />
  );
};
