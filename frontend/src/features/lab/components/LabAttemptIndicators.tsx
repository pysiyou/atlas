/**
 * Attempt count indicator for retest / recollection lineage.
 */
import { useState } from 'react';
import { Badge } from '@/components/primitives';
import { cn } from '@/utils';
import { IconKeys } from '@/icons';
import { text, OVERLAY, FG } from '@/theme/recipes';

interface AttemptIndicatorProps {
  attemptNumber: number;
  maxAttempts: number;
  type: 'retest' | 'recollection';
  previousReason?: string;
  className?: string;
}

export function AttemptIndicator({
  attemptNumber,
  maxAttempts,
  type,
  previousReason,
  className,
}: AttemptIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (attemptNumber <= 1) {
    return null;
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
        icon={IconKeys.actions.alertCircle}
        className="cursor-help"
      >
        {attemptNumber}/{maxAttempts}
      </Badge>
      {showTooltip && (
        <div className={`absolute top-full right-0 mt-space-1 z-50 w-64 p-space-3 ${OVERLAY.shellShadowXl}`}>
          <div className="space-y-space-1">
            <p className={`${text({ role: 'body' })} font-normal`}>
              {typeLabel} Attempt #{attemptNumber}
            </p>
            {previousReason && (
              <p className={`${text({ role: 'caption' })} leading-tight`}>
                <span className={FG.labelMuted}>Previous: </span>
                {previousReason}
              </p>
            )}
            <p className={`${text({ role: 'caption' })} ${FG.disabled}`}>
              {maxAttempts - attemptNumber} {maxAttempts - attemptNumber === 1 ? 'attempt' : 'attempts'} remaining
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
