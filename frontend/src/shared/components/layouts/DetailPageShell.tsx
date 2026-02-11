/**
 * DetailPageShell - Standard wrapper for detail pages. Enforces p-2 gap-4, header slot, scrollable content.
 * Handles loading, error, and not-found via optional props so callers avoid inline duplication.
 */

import React, { type ReactNode } from 'react';
import { LoadingState } from '../feedback/LoadingState';
import { ErrorAlert } from '../feedback/ErrorAlert';
import { EmptyState } from '@/shared/ui';
import { ICONS } from '@/utils';

export interface DetailPageShellError {
  message: string;
  code?: string;
  operation?: string;
}

export interface DetailPageShellProps {
  /** Header node (e.g. DetailPageHeader or feature header wrapping it) */
  header: ReactNode;
  /** Main content (rendered in scrollable area when not loading/error/notFound) */
  children: ReactNode;
  /** When true, show full-screen loading instead of content */
  loading?: boolean;
  /** Loading message when loading is true */
  loadingMessage?: string;
  /** When set, show ErrorAlert above content (or instead of content if no children yet) */
  error?: DetailPageShellError | null;
  /** Retry handler for error state */
  onRetry?: () => void;
  /** Dismiss handler for error state */
  onDismissError?: () => void;
  /** When true, show EmptyState instead of content */
  notFound?: boolean;
  /** Title for not-found EmptyState */
  notFoundTitle?: string;
  /** Description for not-found EmptyState */
  notFoundDescription?: string;
  className?: string;
}

export const DetailPageShell: React.FC<DetailPageShellProps> = ({
  header,
  children,
  loading = false,
  loadingMessage = 'Loading...',
  error = null,
  onRetry,
  onDismissError,
  notFound = false,
  notFoundTitle = 'Not Found',
  notFoundDescription,
  className = '',
}) => {
  if (loading) {
    return <LoadingState message={loadingMessage} fullScreen />;
  }

  return (
    <div className={`min-h-full flex flex-col p-2 gap-4 ${className}`.trim()}>
      <div className="shrink-0">{header}</div>
      {error != null ? (
        <div className="flex-1 min-h-0">
          <ErrorAlert error={error} onRetry={onRetry} onDismiss={onDismissError} />
        </div>
      ) : notFound ? (
        <div className="flex-1 flex items-center justify-center min-h-0">
          <EmptyState
            icon={ICONS.actions.alertCircle}
            title={notFoundTitle}
            description={notFoundDescription}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto">{children}</div>
      )}
    </div>
  );
};
