/**
 * Attempt count indicator and remaining-attempt progress bar.
 */
import React, { useState } from 'react';
import { Badge, Icon } from '@/components';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';

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
        <span className="text-xxs">
          {attemptNumber}/{maxAttempts}
        </span>
      </Badge>

      {/* Hover tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-1 z-50 w-64 bg-surface-elevated border border-border-default rounded-lg shadow-xl p-3">
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

/**
 * AttemptProgressBar - Visual indicator for remaining attempts
 * Shows progress bar with remaining attempt count
 */

interface AttemptProgressBarProps {
  /** Current attempts used */
  used: number;
  /** Total attempts allowed */
  total: number;
  /** Label for the action */
  label: string;
  /** Color variant */
  variant?: 'sky' | 'red' | 'warning';
  className?: string;
}

const VARIANT_COLORS = {
  sky: {
    bar: 'bg-tone-info-text',
    bg: 'bg-tone-info-bg',
    text: 'text-tone-info-text',
  },
  red: {
    bar: 'bg-tone-danger-text',
    bg: 'bg-tone-danger-bg',
    text: 'text-tone-danger-text',
  },
  warning: {
    bar: 'bg-tone-warning-text',
    bg: 'bg-tone-warning-bg',
    text: 'text-tone-warning-text',
  },
};

/**
 * AttemptProgressBar component
 * Displays a progress bar showing used/remaining attempts
 */
export const AttemptProgressBar: React.FC<AttemptProgressBarProps> = ({
  used,
  total,
  label,
  variant = 'sky',
  className,
}) => {
  const remaining = Math.max(0, total - used);
  const percentage = total > 0 ? ((total - used) / total) * 100 : 0;
  const colors = VARIANT_COLORS[variant];

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xxs">
        <span className="font-normal text-text-secondary">{label}</span>
        <span className={cn('font-normal', colors.text)}>
          {remaining} {remaining === 1 ? 'left' : 'left'}
        </span>
      </div>
      <div className={cn('h-1.5 rounded-full overflow-hidden', colors.bg)}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', colors.bar)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

