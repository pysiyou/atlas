/**
 * DetailPageShell - Standard wrapper for detail pages.
 * When AppShell chrome is active, headers portal to the top row; the in-flow header slot uses
 * `contents` so flex gap does not reserve space under the chrome (same as list pages).
 */

import React, { type ReactNode } from 'react';
import { LoadingState } from '@/components/loaders/LoadingState';
import { ErrorAlert } from '@/components/loaders/ErrorAlert';
import { EmptyState } from '@/components';
import { ICONS } from '@/config/icons';
import { WORKSPACE } from '@/components/theme/recipes';
import { useAppChromeMount } from './appChromeMount';
import { cn } from '@/utils';

export interface DetailPageShellError {
  message: string;
  code?: string;
  operation?: string;
}

export interface DetailPageShellProps {
  /** Header node (e.g. PageHeader or feature header wrapping it) */
  header: ReactNode;
  /** Main content (rendered in scrollable area when not loading/error/notFound) */
  children: ReactNode;
  /** When true, show full-screen loading instead of content (or loadingSkeleton if provided) */
  loading?: boolean;
  /** Loading message when loading is true (used only when loadingSkeleton is not provided) */
  loadingMessage?: string;
  /** Optional skeleton to show in place of content when loading; shell still shows header + this in scroll area */
  loadingSkeleton?: ReactNode;
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
  loadingSkeleton,
  error = null,
  onRetry,
  onDismissError,
  notFound = false,
  notFoundTitle = 'Not Found',
  notFoundDescription,
  className = '',
}) => {
  const headerInChrome = useAppChromeMount() != null;
  const headerSlotClass = headerInChrome ? 'contents' : 'shrink-0';

  if (loading) {
    if (loadingSkeleton != null) {
      return (
        <div className={cn(WORKSPACE.page, className)}>
          <div className={headerSlotClass}>{header}</div>
          <div className="flex-1 min-h-0 overflow-auto" aria-busy="true">
            {loadingSkeleton}
          </div>
        </div>
      );
    }
    return <LoadingState message={loadingMessage} fullScreen />;
  }

  return (
    <div className={cn(WORKSPACE.page, className)}>
      <div className={headerSlotClass}>{header}</div>
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
