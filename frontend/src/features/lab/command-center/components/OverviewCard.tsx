/**
 * OverviewCard - Three KPIs: Total Pending, Critical Alerts, STAT Urgent.
 * Large values; STAT uses warning styling.
 */

import React from 'react';
import { Card } from '@/shared/ui';
import { StatUrgentCounter } from './StatUrgentCounter';
import type { CommandCenterData } from '../types';

export interface OverviewCardProps {
  workflow: CommandCenterData['workflow'];
  criticalAlertsCount: number;
  statUrgentCount: number;
}

export const OverviewCard: React.FC<OverviewCardProps> = ({
  workflow,
  criticalAlertsCount,
  statUrgentCount,
}) => {
  const totalPending =
    workflow.preAnalytical.pending +
    workflow.analytical.pending +
    workflow.postAnalytical.pending;

  return (
    <Card className="rounded-xl min-w-0 overflow-hidden shrink-0" padding="sm" variant="default">
      <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide mb-2">
        Overview
      </h3>
      <div className="space-y-2">
        <div>
          <p className="text-xxs text-text-tertiary uppercase tracking-wide">Total Pending</p>
          <p className="text-xl font-bold text-text-primary tabular-nums">{totalPending}</p>
        </div>
        <div>
          <p className="text-xxs text-text-tertiary uppercase tracking-wide">Critical Alerts</p>
          <p
            className={`text-xl font-bold tabular-nums ${
              criticalAlertsCount > 0 ? 'text-feedback-danger-text' : 'text-text-primary'
            }`}
          >
            {criticalAlertsCount}
          </p>
        </div>
        <StatUrgentCounter count={statUrgentCount} />
      </div>
    </Card>
  );
};
