/**
 * LoadingState - Standardized loading UI component
 *
 * Provides a consistent loading indicator across the application.
 * Supports different sizes and full-screen mode.
 */

import React from 'react';
import { loadingState } from '@/shared/design-system/tokens/components/shared';

export interface LoadingStateProps {
  /** Loading message to display */
  message?: string;
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to display in full-screen mode */
  fullScreen?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const SIZE_CLASSES = loadingState.sizes;

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
    ? loadingState.container.fullScreen
    : loadingState.container.inline;

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div
          className={`inline-block animate-spin rounded-full ${loadingState.spinner} ${SIZE_CLASSES[size]}`}
          role="status"
          aria-label="Loading"
        />
        {message && <p className={`mt-3 ${loadingState.message}`}>{message}</p>}
      </div>
    </div>
  );
};
