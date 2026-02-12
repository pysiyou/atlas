/**
 * LoadingState - Standardized loading UI component
 *
 * Provides a consistent loading indicator across the application.
 * Supports different sizes and full-screen mode. Uses ClaudeLoader (radiating-arms animation).
 */

import React from 'react';
import { ClaudeLoader } from '@/shared/ui';

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
    : 'flex items-center justify-center p-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div role="status" aria-label="Loading">
          <ClaudeLoader size={size} color="var(--success-fg)" />
        </div>
        {message && <p className="mt-3 text-sm text-text-tertiary">{message}</p>}
      </div>
    </div>
  );
};
