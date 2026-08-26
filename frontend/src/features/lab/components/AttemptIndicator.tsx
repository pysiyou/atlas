/**
 * AttemptIndicator - Subtle corner badge showing attempt number
 * Displays as "2/3" with hover details for rejection history
 */

import React, { useState } from 'react';
import { Badge, Icon } from '@/components';
import { ICONS, cn } from '@/utils';

interface AttemptIndicatorProps {
  /** Current attempt number (1-based) */
  attemptNumber: number;
  /** Maximum attempts allowed */
  maxAttempts: number;
  /** Type of attempt (retest or recollection) */
  type: 'retest' | 'recollection';
  /** Previous rejection reason (shown on hover) */
  previousReason?: string;
  className?: string;
}

/**
 * AttemptIndicator component
 * Shows attempt count with hover tooltip for rejection history
 */
export const AttemptIndicator: React.FC<AttemptIndicatorProps> = ({
  attemptNumber,
  maxAttempts,
  type,
  previousReason,
  className,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (attemptNumber <= 1) {
    return null; // Don't show for first attempt
  }

  const isNearLimit = attemptNumber >= maxAttempts - 1;
  const typeLabel = type === 'retest' ? 'Re-test' : 'Recollection';

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Badge
        variant={isNearLimit ? 'warning' : 'default'}
        size="xs"
        className="flex items-center gap-1 cursor-help"
      >
        <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
        <span className="font-mono text-xxs">
          {attemptNumber}/{maxAttempts}
        </span>
      </Badge>

      {/* Hover tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-1 z-50 w-64 bg-surface-elevated border border-border-default rounded-lg shadow-xl p-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-1">
            <p className="text-xs font-normal text-text-primary">
              {typeLabel} Attempt #{attemptNumber}
            </p>
            {previousReason && (
              <p className="text-xxs text-text-tertiary leading-tight">
                <span className="text-text-secondary">Previous: </span>
                {previousReason}
              </p>
            )}
            <p className="text-xxs text-text-disabled">
              {maxAttempts - attemptNumber} {maxAttempts - attemptNumber === 1 ? 'attempt' : 'attempts'} remaining
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
