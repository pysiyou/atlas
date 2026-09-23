/**
 * Critical Value Banner — inline banner for critical values (auto-notified on approval).
 */

import React from 'react';
import { Alert, Icon, Badge } from '@/components';
import { ICONS } from '@/config/icons';
import { FIELD_ERROR, TONE, TYPE } from '@/components/theme/recipes';


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
 * Shows which values are critical without requiring explicit acknowledgment.
 */
export const ResultCriticalValueBanner: React.FC<CriticalValueBannerProps> = ({
  criticalParameters,
  className,
}) => {
  if (criticalParameters.length === 0) {
    return null;
  }

  return (
    <Alert variant="danger" className={className}>
      <div className="space-y-space-2">
        <div className="flex items-center gap-space-2">
          <Icon name={ICONS.actions.alertCircle} className="w-4 h-4" />
          <h4 className={`${FIELD_ERROR}`}>
            Contains Critical Values
          </h4>
        </div>
        <div className="pl-space-6 space-y-space-1">
          {criticalParameters.map((param, index) => (
            <div key={index} className={`flex items-baseline gap-space-2 ${TYPE.value}`}>
              <Badge variant="danger" size="xs" className="shrink-0">
                {param.name}
              </Badge>
              <span className={`font-normal ${TONE.danger.fg}`}>
                {param.value}
                {param.unit && <span className={`ml-space-1 ${TYPE.caption}`}>{param.unit}</span>}
              </span>
            </div>
          ))}
        </div>
        <p className={`${TYPE.caption} pl-space-6`}>
          Physician will be automatically notified upon approval
        </p>
      </div>
    </Alert>
  );
};
