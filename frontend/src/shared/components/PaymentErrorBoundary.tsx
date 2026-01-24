/**
 * Payment Error Boundary
 * Specialized error boundary for payment processing components.
 * Provides user-friendly error messages and recovery options.
 */

import type { ReactNode, ErrorInfo } from 'react';
import { createErrorBoundary } from './createErrorBoundary';

export interface PaymentErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback message */
  fallbackMessage?: string;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * PaymentErrorBoundary Component
 * Catches errors in payment components and displays a user-friendly message.
 */
export const PaymentErrorBoundary = createErrorBoundary({
  name: 'Payment Processing Error',
  defaultMessage:
    'An error occurred while processing the payment. Please try again or contact support if the issue persists.',
  retryButtonLabel: 'Try Again',
  showReloadButton: true,
  logPrefix: 'Payment Error Boundary',
});
