/**
 * SectionLoadingBoundary — shows LoadingState in a section when loading is true.
 */
import React, { type ReactNode } from 'react';
import { LoadingState } from '@/components/feedback/LoadingState';

export interface SectionLoadingBoundaryProps {
  scopeId: string;
  loading: boolean;
  children: ReactNode;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

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
