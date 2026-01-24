/**
 * Payment Error Boundary
 * Specialized error boundary for payment processing components
 * Provides user-friendly error messages and recovery options
 */

import React, { Component, type ReactNode } from 'react';
import { Alert, Button } from '@/shared/ui';
import { Icon } from '@/shared/ui';

interface PaymentErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback message */
  fallbackMessage?: string;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface PaymentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * PaymentErrorBoundary Component
 * Catches errors in payment components and displays a user-friendly message
 */
export class PaymentErrorBoundary extends Component<
  PaymentErrorBoundaryProps,
  PaymentErrorBoundaryState
> {
  constructor(props: PaymentErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): PaymentErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Payment Error Boundary caught an error:', error, errorInfo);
    }

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <Alert variant="danger" className="mb-4">
            <div className="flex items-start gap-3">
              <Icon name="alert-circle" className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Payment Processing Error</h3>
                <p className="text-sm text-red-700 mb-3">
                  {this.props.fallbackMessage ||
                    'An error occurred while processing the payment. Please try again or contact support if the issue persists.'}
                </p>
                {this.state.error && process.env.NODE_ENV === 'development' && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">Error Details</summary>
                    <pre className="mt-2 text-xs text-red-800 bg-red-50 p-2 rounded overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </details>
                )}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={this.handleReset}
                    icon={<Icon name="refresh-cw" />}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="cancel"
                    size="sm"
                    onClick={() => window.location.reload()}
                    icon={<Icon name="x" />}
                  >
                    Reload Page
                  </Button>
                </div>
              </div>
            </div>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
