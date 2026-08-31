/**
 * Error state for ActivitiesTimeline.
 */

import React from 'react';

export interface ActivitiesTimelineErrorProps {
  className?: string;
  error?: Error | null;
  onRetry?: () => void;
}

export const ActivitiesTimelineError: React.FC<ActivitiesTimelineErrorProps> = ({
  className = '',
  error = null,
  onRetry,
}) => (
  <div className={`flex flex-col h-full bg-surface ${className}`}>
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 py-8">
      <p className="text-sm text-text-secondary text-center">Couldn&apos;t load activities</p>
      {error?.message && (
        <p className="text-xxs text-text-tertiary text-center max-w-[200px]">{error.message}</p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-brand rounded px-2 py-1"
        >
          Retry
        </button>
      )}
    </div>
  </div>
);
