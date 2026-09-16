/**
 * Lab health status — inline indicator in the live pipeline header.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components';
import { ICONS } from '@/config/icons';
import { cn } from '@/utils';
import { getLabTabPath } from '../../constants/labTabs';
import type { LabCommandCenterSnapshot } from '../boardTypes';
import { COMMAND_CENTER_HEALTH_STYLES, COMMAND_CENTER_TEXT } from '../commandCenterStyles';

function formatLastRefreshed(at: Date): string {
  const diffSec = Math.floor((Date.now() - at.getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

interface LabHealthStatusProps {
  health: LabCommandCenterSnapshot['health'];
  message: string;
  suggestedTab: LabCommandCenterSnapshot['suggestedTab'];
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastRefreshedAt?: Date | null;
}

export const LabHealthStatus: React.FC<LabHealthStatusProps> = ({
  health,
  message,
  suggestedTab,
  onRefresh,
  isRefreshing = false,
  lastRefreshedAt = null,
}) => {
  const styles = COMMAND_CENTER_HEALTH_STYLES[health];
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!lastRefreshedAt) return undefined;
    const interval = window.setInterval(() => setTick(t => t + 1), 30_000);
    return () => window.clearInterval(interval);
  }, [lastRefreshedAt]);

  return (
    <div className="flex min-w-0 shrink-0 items-center justify-end gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', styles.dot)}
          aria-hidden
          title={message}
        />
        <p
          className={cn('max-w-[min(28rem,40vw)] truncate text-xs', styles.text)}
          aria-live="polite"
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
            className="inline-flex shrink-0 items-center rounded p-1 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
          >
            <Icon
              name={ICONS.actions.refresh}
              className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')}
            />
          </button>
        )}
      </div>
    </div>
  );
};
