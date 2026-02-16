/**
 * LoadingState - Standardized loading UI component
 *
 * Provides a consistent loading indicator across the application.
 * Supports different sizes and full-screen mode. Uses DnaHelixLoader by default;
 * set variant="default" for the ClaudeLoader (radiating-arms) style.
 */

import React from 'react';
import { ClaudeLoader, DnaHelixLoader } from '@/shared/ui';

export interface LoadingStateProps {
  /** Loading message to display */
  message?: string;
  /** Size of the loader */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to display in full-screen mode */
  fullScreen?: boolean;
  /** Loader variant: dna (double-helix) or default (radiating arms) */
  variant?: 'dna' | 'default';
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
  variant = 'dna',
  className = '',
}) => {
  const containerClasses = fullScreen
    ? 'flex items-center justify-center min-h-screen'
    : 'flex items-center justify-center p-8';

  const Loader =
    variant === 'dna' ? (
      <DnaHelixLoader size={size} />
    ) : (
      <ClaudeLoader size={size} color="var(--success-fg)" />
    );

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div role="status" aria-label="Loading">
          {Loader}
        </div>
        {message && <p className="mt-3 text-sm text-text-tertiary">{message}</p>}
      </div>
    </div>
  );
};
