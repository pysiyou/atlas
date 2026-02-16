/**
 * SectionLoadingBoundary - Renders LoadingState in a non-full-screen area when loading is true.
 * Keeps layout (sidebar, filters) visible and interactive; only this section shows the loader.
 * @module shared/loading/SectionLoadingBoundary
 */

import React, { type ReactNode } from 'react';
import { LoadingState } from '@/shared/components/feedback/LoadingState';

export interface SectionLoadingBoundaryProps {
  /** Section identifier (for future use with useIsSectionLoading). */
  scopeId: string;
  /** When true, show LoadingState instead of children. */
  loading: boolean;
  children: ReactNode;
  /** Message for LoadingState. */
  message?: string;
  /** Size for LoadingState. */
  size?: 'sm' | 'md' | 'lg';
  /** Optional class for the loading container. */
  className?: string;
}

/**
 * When loading is true, shows LoadingState in a centered section container (not full-screen).
 * When loading is false, renders children.
 */
export function SectionLoadingBoundary({
  scopeId: _scopeId,
  loading,
  children,
  message = 'Loading...',
  size = 'lg',
  className = '',
}: SectionLoadingBoundaryProps): React.ReactElement {
  if (loading) {
    return (
      <div
        className={`flex min-h-[280px] items-center justify-center ${className}`}
        aria-busy="true"
        aria-label={message}
      >
        <LoadingState message={message} size={size} fullScreen={false} />
      </div>
    );
  }
  return <>{children}</>;
}
