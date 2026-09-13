/**
 * Lab health status — inline (header) or banner layout.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components';
import { ICONS } from '@/config/icons';
import { cn } from '@/utils';
import { getLabTabPath } from '../../constants/labTabs';
import type { LabTechBoardData } from '../boardTypes';
import { COMMAND_CENTER_HEALTH_STYLES, COMMAND_CENTER_TEXT } from '../components/styles';

function formatLastRefreshed(at: Date): string {
  const diffSec = Math.floor((Date.now() - at.getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

interface LabHealthStatusProps {
  health: LabTechBoardData['health'];
  message: string;
  suggestedTab: LabTechBoardData['suggestedTab'];
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastRefreshedAt?: Date | null;
  /** Inline sits in the pipeline header; banner is a full-width row (legacy). */
  variant?: 'inline' | 'banner';
}

export const LabHealthStatus: React.FC<LabHealthStatusProps> = ({
  health,
  message,
  suggestedTab,
  onRefresh,
  isRefreshing = false,
  lastRefreshedAt = null,
  variant = 'inline',
}) => {
  const styles = COMMAND_CENTER_HEALTH_STYLES[health];
  const isInline = variant === 'inline';
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!lastRefreshedAt) return undefined;
    const interval = window.setInterval(() => setTick(t => t + 1), 30_000);
    return () => window.clearInterval(interval);
  }, [lastRefreshedAt]);

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

      <div className="flex shrink-0 items-center gap-2">
        {lastRefreshedAt && (
          <span
            className={cn('hidden tabular-nums sm:inline', COMMAND_CENTER_TEXT.panelMeta, 'text-xxs')}
            title={lastRefreshedAt.toLocaleString()}
          >
            Updated {formatLastRefreshed(lastRefreshedAt)}
          </span>
        )}

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
    </div>
  );
};
