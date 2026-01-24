/**
 * Data Error Boundary
 * Specialized error boundary for data fetching components.
 * Provides user-friendly error messages and retry functionality.
 */

import type { ReactNode, ErrorInfo } from 'react';
import { createErrorBoundary } from './createErrorBoundary';

export interface DataErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback message */
  fallbackMessage?: string;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Callback for retry action */
  onRetry?: () => void;
}

/**
 * DataErrorBoundary Component
 * Catches errors in data fetching components and displays a user-friendly message.
 */
export const DataErrorBoundary = createErrorBoundary({
  name: 'Data Loading Error',
  defaultMessage: 'An error occurred while loading data. Please try again.',
  retryButtonLabel: 'Retry',
  logPrefix: 'Data Error Boundary',
});
