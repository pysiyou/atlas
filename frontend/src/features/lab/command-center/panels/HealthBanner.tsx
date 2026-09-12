/**
 * Lab health status — inline (header) or banner layout.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components';
import { ICONS } from '@/config/icons';
import { cn } from '@/utils';
import { getLabTabPath } from '../../constants/labTabs';
import type { LabTechBoardData } from '../hooks/useLabTechBoard';

const HEALTH_STYLES = {
  healthy: {
    dot: 'bg-success-fg-emphasis',
    text: 'text-success-fg-emphasis',
    bg: 'bg-success-bg/40 border-success-fg/20',
  },
  attention: {
    dot: 'bg-warning-fg-emphasis',
    text: 'text-warning-fg-emphasis',
    bg: 'bg-warning-bg/40 border-warning-fg/20',
  },
  critical: {
    dot: 'bg-danger-fg-emphasis',
    text: 'text-danger-fg-emphasis',
    bg: 'bg-danger-bg/40 border-danger-fg/20',
  },
} as const;

interface LabHealthStatusProps {
  health: LabTechBoardData['health'];
  message: string;
  suggestedTab: LabTechBoardData['suggestedTab'];
  onRefresh?: () => void;
  isRefreshing?: boolean;
  /** Inline sits in the pipeline header; banner is a full-width row (legacy). */
  variant?: 'inline' | 'banner';
}

export const LabHealthStatus: React.FC<LabHealthStatusProps> = ({
  health,
  message,
  suggestedTab,
  onRefresh,
  isRefreshing = false,
  variant = 'inline',
}) => {
  const styles = HEALTH_STYLES[health];
  const isInline = variant === 'inline';

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2',
        isInline ? 'shrink-0 justify-end' : 'shrink-0 justify-between gap-3 rounded border px-3 py-2',
        !isInline && styles.bg,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', styles.dot)}
          aria-hidden
          title={message}
        />
        <p
          className={cn(
            'truncate',
            isInline ? 'max-w-[min(28rem,40vw)] text-xs' : 'text-sm',
            styles.text,
          )}
        >
          {message}
        </p>
        {suggestedTab && health !== 'healthy' && (
          <Link
            to={getLabTabPath(suggestedTab)}
            className="shrink-0 text-sm text-brand hover:underline"
          >
            View queue
          </Link>
        )}
      </div>

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh lab status"
          title="Refresh"
          className={cn(
            'inline-flex shrink-0 items-center transition-colors disabled:opacity-50',
            isInline
              ? 'rounded p-1 text-text-tertiary hover:bg-surface-hover hover:text-text-primary'
              : 'gap-1 rounded px-2 py-1 text-xxs text-text-secondary hover:bg-surface-hover hover:text-text-primary',
          )}
        >
          <Icon
            name={ICONS.actions.loading}
            className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')}
          />
          {!isInline && 'Refresh'}
        </button>
      )}
    </div>
  );
};

/** @deprecated Use LabHealthStatus with variant="banner" */
export const HealthBanner = (props: Omit<LabHealthStatusProps, 'variant'>) => (
  <LabHealthStatus {...props} variant="banner" />
);
