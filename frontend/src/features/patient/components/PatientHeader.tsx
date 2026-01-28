/**
 * PatientHeader Component
 * Displays patient header with avatar and action buttons
 */

import React from 'react';
import { Button, Avatar, Icon, IconButton } from '@/shared/ui';
import type { Patient } from '@/types/patient';
import { usePatientService } from '../services/usePatientService';
import { AffiliationPopover } from './AffiliationPopover';
import { ICONS } from '@/utils/icon-mappings';

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
  return (
    <div className="flex items-center justify-between mb-4 shrink-0 flex-wrap gap-3">
      <div className="flex items-center gap-2 self-center">
        <Avatar primaryText={patient.fullName} size="sm" />
        {isAffiliationActive(patient.affiliation) && (
          <AffiliationPopover
            affiliation={patient.affiliation}
            trigger={
              <button
                className="focus:outline-none focus:ring-2 focus:ring-brand/20 rounded transition-all flex items-center justify-center"
                aria-label="View affiliation details"
                title="View affiliation details"
              >
                <Icon
                  name={ICONS.ui.verified}
                  className="w-5 h-5 text-brand/70 hover:text-brand transition-colors cursor-pointer"
                />
              </button>
            }
          />
        )}
      </div>

      <div
        className={`flex items-center gap-2 self-center ${!isLarge ? 'w-full sm:w-auto sm:justify-end justify-end' : ''}`}
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
    </div>
  );
};
