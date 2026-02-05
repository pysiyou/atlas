/**
 * Panic Value Alert Component
 * Display critical/panic value alerts that require immediate attention
 */

import React from 'react';
import { Icon, Badge } from '@/shared/ui';
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
? 'bg-danger-bg border-danger-border'
            : 'bg-danger-bg-strong border-danger-border-strong shadow-lg'
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
            <h4 className="text-sm font-bold text-danger-fg-strong uppercase tracking-wide">
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
              <span className="text-sm font-semibold text-fg">{parameterName}:</span>
              <span className="text-lg font-bold text-danger-fg-strong">
                {value}
                {unit && <span className="ml-1 text-sm font-normal">{unit}</span>}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              {referenceRange && (
                <div>
                  <span className="text-fg-subtle">Reference Range:</span>
                  <span className="ml-2 font-medium text-fg-muted">{referenceRange}</span>
                </div>
              )}
              <div>
                <span className="text-fg-subtle">Critical Threshold:</span>
                <span className="ml-2 font-medium text-danger-fg-strong">
                  {isCriticalLow && criticalLow !== undefined && `< ${criticalLow} ${unit || ''}`}
                  {isCriticalHigh && criticalHigh !== undefined && `> ${criticalHigh} ${unit || ''}`}
                </span>
              </div>
            </div>

            <div className="mt-3 p-3 bg-warning-bg border border-warning-border rounded text-xs">
              <p className="font-semibold text-warning-text-strong mb-1">📋 Required Actions:</p>
              <ul className="list-disc list-inside space-y-1 text-warning-text-strong">
                <li>Immediately notify the ordering physician</li>
                <li>Verify patient identification</li>
                <li>Consider retest to confirm result</li>
                <li>Document notification and time</li>
              </ul>
            </div>
          </div>

          {onAcknowledge && !isAcknowledged && (
            <button
              onClick={onAcknowledge}
              className="mt-4 px-4 py-2 bg-danger hover:bg-danger-hover text-on-danger text-sm font-semibold rounded transition-colors flex items-center gap-2"
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
