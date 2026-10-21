/**
 * DetailPageShell - Standard wrapper for detail pages.
 * When AppShell chrome is active, headers portal to the top row; the in-flow header slot uses
 * `contents` so flex gap does not reserve space under the chrome (same as list pages).
 */

import React, { type ReactNode } from 'react';
import { DetailPageSkeleton } from '@/components/feedback/DetailPageSkeleton';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { EmptyState } from '@/components/display';
import { ICONS } from '@/config/icons';
import { WORKSPACE } from '@/theme/recipes';
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
  /** When true, show loading skeleton in the scroll area instead of content */
  loading?: boolean;
  /** Optional skeleton when loading; defaults to a generic detail layout */
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
    const skeleton =
      loadingSkeleton ?? <DetailPageSkeleton variant="responsive-detail" aria-label="Loading" />;
    return (
      <div className={cn(WORKSPACE.page, className)}>
        <div className={headerSlotClass}>{header}</div>
        <div className="flex-1 min-h-0 overflow-auto" aria-busy="true">
          {skeleton}
        </div>
      </div>
    );
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
