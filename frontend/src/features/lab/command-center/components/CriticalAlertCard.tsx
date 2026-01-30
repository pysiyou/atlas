/**
 * CriticalAlertCard - Single panic value alert with Notify Doctor action.
 * High-contrast styling; pulse when un-notified.
 */

import React from 'react';
import { Icon, Button } from '@/shared/ui';
import { ICONS } from '@/utils';
import { cn } from '@/utils';
import type { CriticalAlert } from '../types';

export interface CriticalAlertCardProps {
  alert: CriticalAlert;
  onNotifyDoctor: (alert: CriticalAlert) => void;
  isNotifying?: boolean;
}

export const CriticalAlertCard: React.FC<CriticalAlertCardProps> = ({
  alert,
  onNotifyDoctor,
  isNotifying = false,
}) => {
  return (
    <div
      className={cn(
        'border-l-4 rounded-lg p-4 bg-feedback-danger-bg border-feedback-danger-border-strong shadow-sm',
        !alert.notifiedAt && 'animate-pulse'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex-shrink-0 p-2 bg-action-danger rounded-full">
            <Icon name={ICONS.actions.alertCircle} className="w-5 h-5 text-action-danger-on" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-feedback-danger-text-strong uppercase tracking-wide">
              Panic value — {alert.parameterName}
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">
              {alert.patientName} · {alert.testName}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg font-bold text-feedback-danger-text-strong">
                {alert.value}
                {alert.unit && <span className="ml-1 text-sm font-normal">{alert.unit}</span>}
              </span>
              <span className="text-xs text-feedback-danger-text">
                ({alert.criticalType === 'high' ? '>' : '<'} {alert.criticalThreshold})
              </span>
            </div>
          </div>
        </div>
        {!alert.notifiedAt && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onNotifyDoctor(alert)}
            disabled={isNotifying}
            icon={<Icon name={ICONS.actions.checkCircle} className="text-action-danger-on" />}
          >
            {isNotifying ? 'Notifying…' : 'Notify Doctor'}
          </Button>
        )}
      </div>
    </div>
  );
}
