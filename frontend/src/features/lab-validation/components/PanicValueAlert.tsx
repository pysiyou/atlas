/**
 * Critical Value Banner Component
 * Simple inline banner for critical values - auto-notified on approval
 */

import React from 'react';
import { Alert, Icon, Badge } from '@/components';
import { ICONS } from '@/utils';

export interface CriticalValueBannerProps {
  /** List of critical parameters */
  criticalParameters: Array<{
    name: string;
    value: string | number;
    unit?: string;
  }>;
  /** Optional CSS classes */
  className?: string;
}

/**
 * Simplified critical value banner
 * Shows which values are critical without requiring explicit acknowledgment
 */
export const CriticalValueBanner: React.FC<CriticalValueBannerProps> = ({
  criticalParameters,
  className,
}) => {
  if (criticalParameters.length === 0) {
    return null;
  }

  return (
    <Alert variant="danger" className={className}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Icon name={ICONS.actions.alertCircle} className="w-4 h-4" />
          <h4 className="text-sm font-normal text-danger-fg">
            Contains Critical Values
          </h4>
        </div>
        <div className="pl-6 space-y-1">
          {criticalParameters.map((param, index) => (
            <div key={index} className="flex items-baseline gap-2 text-xs">
              <Badge variant="danger" size="xs" className="shrink-0">
                {param.name}
              </Badge>
              <span className="font-normal text-danger-fg">
                {param.value}
                {param.unit && <span className="ml-1 text-xxs">{param.unit}</span>}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xxs text-text-tertiary pl-6">
          Physician will be automatically notified upon approval
        </p>
      </div>
    </Alert>
  );
};
