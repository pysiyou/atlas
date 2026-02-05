/**
 * LoadingState - Standardized loading UI component
 *
 * Provides a consistent loading indicator across the application.
 * Supports different sizes and full-screen mode.
 */

import React from 'react';

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

const SIZE_CLASSES = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-3',
  lg: 'w-16 h-16 border-4',
};

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
    : 'flex items-center justify-center p-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div
          className={`inline-block animate-spin rounded-full border-brand border-t-transparent ${SIZE_CLASSES[size]}`}
          role="status"
          aria-label="Loading"
        />
        {message && <p className="mt-3 text-sm text-fg-subtle">{message}</p>}
      </div>
    </div>
  );
};
