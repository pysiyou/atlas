/**
 * AffiliationInfoSection Component
 * Displays patient affiliation information
 */

import React from 'react';
import { Badge, DetailField } from '@/components';
import { formatDate } from '@/utils';
import type { Affiliation } from '@/types';
import { isAffiliationActive } from '../utils/patientHelpers';
import { TONE } from '@/components/theme/recipes';

interface AffiliationInfoProps {
  affiliation: Affiliation;
}

/**
 * AffiliationInfo - Displays affiliation details in grid format
 */
export const AffiliationInfo: React.FC<AffiliationInfoProps> = ({ affiliation }) => {
  const isActive = isAffiliationActive(affiliation);

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      <DetailField
        orientation="vertical"
        label="Assurance Number"
        value={affiliation.assuranceNumber}
        className="col-span-2"
      />
      <DetailField
        orientation="vertical"
        label="Status"
        value={
          <Badge variant={isActive ? 'success' : 'danger'} size="xs" className="inline-flex">
            {isActive ? 'Active' : 'Expired'}
          </Badge>
        }
      />
      <DetailField
        orientation="vertical"
        label="Duration"
        value={`${affiliation.duration} Months`}
      />
      <DetailField
        orientation="vertical"
        label="Start Date"
        value={formatDate(affiliation.startDate)}
      />
      <DetailField
        orientation="vertical"
        label="End Date"
        value={
          <span className={isActive ? undefined : TONE.danger.fg}>
            {formatDate(affiliation.endDate)}
          </span>
        }
      />
    </div>
  );
};
