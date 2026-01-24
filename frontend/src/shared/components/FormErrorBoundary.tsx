/**
 * Form Error Boundary
 * Specialized error boundary for form components.
 * Provides user-friendly error messages and recovery options.
 */

import type { ReactNode, ErrorInfo } from 'react';
import { createErrorBoundary } from './createErrorBoundary';

export interface FormErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback message */
  fallbackMessage?: string;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * FormErrorBoundary Component
 * Catches errors in form components and displays a user-friendly message.
 */
export const FormErrorBoundary = createErrorBoundary({
  name: 'Form Error',
  defaultMessage: 'An error occurred while rendering the form. Please try refreshing the page.',
  retryButtonLabel: 'Try Again',
  logPrefix: 'Form Error Boundary',
});
