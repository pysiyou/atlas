/**
 * LoadingState - Standardized loading UI component
 *
 * Provides a consistent loading indicator across the application.
 * Supports different sizes and full-screen mode.
 */

import React from 'react';
import { SpinnerLoader } from '@/components';
import { RADIUS } from '@/components/theme/recipes';
import { cn } from '@/utils/cn';

const LOADER_GLOW: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'size-14',
  md: 'size-[4.5rem]',
  lg: 'size-24',
};

export interface LoadingStateProps {
  /** Loading message to display */
  message?: string;
  /** Size of the loader */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to display in full-screen mode */
  fullScreen?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * LoadingState component
 *
 * @example
 * ```tsx
 * <LoadingState message="Loading patients..." size="md" />
 * ```
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
  className = '',
}) => {
  const containerClasses = fullScreen
    ? 'flex items-center justify-center min-h-screen'
    : 'flex items-center justify-center p-space-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center gap-space-4 text-center">
        <div className="relative flex items-center justify-center">
          <div
            aria-hidden
            className={cn(
              `pointer-events-none absolute ${RADIUS.pill} bg-brand/15 blur-2xl`,
              'motion-reduce:opacity-70',
              LOADER_GLOW[size],
            )}
          />
          <SpinnerLoader size={size} className="relative z-[1] text-brand" />
        </div>
        {message && (
          <p className="max-w-[18rem] text-sm font-medium tracking-tight text-text-secondary">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};
