/**
 * RedZoneSection - Critical alerts + STAT/urgent counter container.
 * Always visible at top; red/danger theme.
 */

import React from 'react';
import { CriticalAlertCard } from './CriticalAlertCard';
import { StatUrgentCounter } from './StatUrgentCounter';
import type { CriticalAlert } from '../types';

export interface RedZoneSectionProps {
  criticalAlerts: CriticalAlert[];
  statUrgentCount: number;
  onNotifyDoctor: (alert: CriticalAlert) => void;
  isNotifying?: boolean;
}

export const RedZoneSection: React.FC<RedZoneSectionProps> = ({
  criticalAlerts,
  statUrgentCount,
  onNotifyDoctor,
  isNotifying = false,
}) => {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50/50 p-4 space-y-4">
      <h2 className="text-sm font-bold text-red-900 uppercase tracking-wide">Red Zone</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {criticalAlerts.length === 0 ? (
            <p className="text-sm text-text-tertiary py-2">No critical alerts</p>
          ) : (
            criticalAlerts.map(alert => (
              <CriticalAlertCard
                key={`${alert.orderId}-${alert.testCode}-${alert.parameterName}`}
                alert={alert}
                onNotifyDoctor={onNotifyDoctor}
                isNotifying={isNotifying}
              />
            ))
          )}
        </div>
        <div className="flex items-start">
          <StatUrgentCounter count={statUrgentCount} />
        </div>
      </div>
    </section>
  );
}
