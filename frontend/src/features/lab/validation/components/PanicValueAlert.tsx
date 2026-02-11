/**
 * Panic Value Alert Component
 * Display critical/panic value alerts that require immediate attention
 */

import React from 'react';
import { CalloutCard, Icon, Badge } from '@/shared/ui';
import { cn } from '@/utils';

export interface PanicValueAlertProps {
  parameterName: string;
  value: string | number;
  unit?: string;
  criticalLow?: number;
  criticalHigh?: number;
  referenceRange?: string;
  onAcknowledge?: () => void;
  isAcknowledged?: boolean;
}

export const PanicValueAlert: React.FC<PanicValueAlertProps> = ({
  parameterName,
  value,
  unit,
  criticalLow,
  criticalHigh,
  referenceRange,
  onAcknowledge,
  isAcknowledged = false,
}) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const isCriticalLow = criticalLow !== undefined && numericValue < criticalLow;
  const isCriticalHigh = criticalHigh !== undefined && numericValue > criticalHigh;

  if (!isCriticalLow && !isCriticalHigh) {
    return null;
  }

  return (
    <div
      className={cn(
        'border-l-4 rounded p-4 animate-pulse',
        isAcknowledged
? 'bg-danger-bg border-danger-stroke'
            : 'bg-danger-bg-emphasis border-danger-stroke-emphasis shadow-lg'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="p-2 bg-danger rounded-full">
            <Icon name="alert-circle" className="w-5 h-5 text-on-danger" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-bold text-danger-fg-emphasis uppercase tracking-wide">
              ⚠️ PANIC VALUE - Immediate Action Required
            </h4>
            {isAcknowledged && (
              <Badge variant="success" size="xs">
                Acknowledged
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-normal text-text-primary">{parameterName}:</span>
              <span className="text-lg font-normal text-danger-fg-emphasis">
                {value}
                {unit && <span className="ml-1 text-sm font-normal">{unit}</span>}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              {referenceRange && (
                <div>
                  <span className="text-text-tertiary">Reference Range:</span>
                  <span className="ml-2 font-normal text-text-secondary">{referenceRange}</span>
                </div>
              )}
              <div>
                <span className="text-text-tertiary">Critical Threshold:</span>
                <span className="ml-2 font-normal text-danger-fg-emphasis">
                  {isCriticalLow && criticalLow !== undefined && `< ${criticalLow} ${unit || ''}`}
                  {isCriticalHigh && criticalHigh !== undefined && `> ${criticalHigh} ${unit || ''}`}
                </span>
              </div>
            </div>

            <CalloutCard
              variant="warning"
              title="Required Actions"
              className="mt-3"
              items={[
                'Immediately notify the ordering physician',
                'Verify patient identification',
                'Consider retest to confirm result',
                'Document notification and time',
              ]}
            />
          </div>

          {onAcknowledge && !isAcknowledged && (
            <button
              onClick={onAcknowledge}
              className="mt-4 px-4 py-2 bg-danger hover:bg-danger-hover text-on-danger text-sm font-normal rounded transition-colors flex items-center gap-2"
            >
              <Icon name="check-circle" className="w-4 h-4" />
              Acknowledge Panic Value
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
