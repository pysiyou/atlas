/**
 * AffiliationInfoSection Component
 * Displays patient affiliation information
 */

import React from 'react';
import { Badge } from '@/shared/ui';
import { formatDate } from '@/utils';
import type { Affiliation } from '@/types';
import { isAffiliationActive } from '../../../utils/patientUtils';

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
      <div className="col-span-2">
        <div className="text-xs text-text-tertiary mb-0.5">Assurance Number</div>
        <div className="font-mono font-medium text-text-primary">{affiliation.assuranceNumber}</div>
      </div>

      <div>
        <div className="text-xs text-text-tertiary mb-0.5">Status</div>
        <Badge variant={isActive ? 'success' : 'danger'} size="sm" className="inline-flex">
          {isActive ? 'Active' : 'Expired'}
        </Badge>
      </div>

      <div>
        <div className="text-xs text-text-tertiary mb-0.5">Duration</div>
        <div className="text-text-primary">{affiliation.duration} Months</div>
      </div>

      <div>
        <div className="text-xs text-text-tertiary mb-0.5">Start Date</div>
        <div className="text-text-primary">{formatDate(affiliation.startDate)}</div>
      </div>

      <div>
        <div className="text-xs text-text-tertiary mb-0.5">End Date</div>
        <div className={`font-medium ${isActive ? 'text-text-primary' : 'text-danger'}`}>
          {formatDate(affiliation.endDate)}
        </div>
      </div>
    </div>
  );
};
