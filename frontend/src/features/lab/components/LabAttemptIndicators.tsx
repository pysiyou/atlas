/**
 * Attempt count indicator and remaining-attempt progress bar.
 */
import React, { useState } from 'react';
import { Badge } from '@/components';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import { OVERLAY, RADIUS, TONE, TYPE } from '@/components/theme/recipes';


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
        variant={isNearLimit ? 'warning' : 'neutral'}
        size="xs"
        uppercase={false}
        icon={ICONS.actions.alertCircle}
        className="cursor-help"
      >
        {attemptNumber}/{maxAttempts}
      </Badge>

      {/* Hover tooltip */}
      {showTooltip && (
        <div className={`absolute top-full right-0 mt-space-1 z-50 w-64 p-space-3 ${OVERLAY.shellShadowXl}`}>
          <div className="space-y-space-1">
            <p className={`${TYPE.value} font-normal`}>
              {typeLabel} Attempt #{attemptNumber}
            </p>
            {previousReason && (
              <p className={`${TYPE.caption} leading-tight`}>
                <span className="text-text-secondary">Previous: </span>
                {previousReason}
              </p>
            )}
            <p className={`${TYPE.caption} text-text-disabled`}>
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

const VARIANT_TONES = {
  sky: TONE.info,
  red: TONE.danger,
  warning: TONE.warning,
} as const;

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
  const colors = VARIANT_TONES[variant];

  return (
    <div className={cn('space-y-space-1', className)}>
      <div className={`flex items-center justify-between ${TYPE.caption}`}>
        <span className="font-normal text-text-secondary">{label}</span>
        <span className={cn('font-normal', colors.fg)}>
          {remaining} {remaining === 1 ? 'left' : 'left'}
        </span>
      </div>
      <div className={cn(`h-1.5 ${RADIUS.pill} overflow-hidden`, colors.well)}>
        <div
          className={cn(`h-full ${RADIUS.pill} transition-all duration-300`, colors.fill)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

