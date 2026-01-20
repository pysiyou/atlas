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
  sm: 'h-6 w-6 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
} as const;

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
    ? 'h-full flex items-center justify-center'
    : 'flex items-center justify-center py-12';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div
          className={`inline-block animate-spin rounded-full border-b-2 border-sky-600 ${SIZE_CLASSES[size]}`}
          role="status"
          aria-label="Loading"
        />
        {message && (
          <p className="mt-3 text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
};
