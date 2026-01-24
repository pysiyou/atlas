/**
 * Error Boundary Factory
 * Creates specialized error boundary components with shared logic.
 * Used by DataErrorBoundary, FormErrorBoundary, and PaymentErrorBoundary.
 */

import React, { Component, type ReactNode } from 'react';
import { Alert, Button, Icon } from '@/shared/ui';

/**
 * Props supported by all factory-created error boundaries.
 * DataErrorBoundary adds onRetry; Form and Payment use only the base props.
 */
export interface CreateErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback message */
  fallbackMessage?: string;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Callback for retry action (DataErrorBoundary only) */
  onRetry?: () => void;
}

interface CreateErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface CreateErrorBoundaryOptions {
  /** Display name for the error (e.g. "Data Loading Error") */
  name: string;
  /** Default message when fallbackMessage is not provided */
  defaultMessage: string;
  /** Label for the retry/try-again button */
  retryButtonLabel?: string;
  /** Whether to show a "Reload Page" button (PaymentErrorBoundary) */
  showReloadButton?: boolean;
  /** Dev-only log prefix for componentDidCatch */
  logPrefix?: string;
}

/**
 * Creates an error boundary component with the given options.
 * Preserves getDerivedStateFromError, componentDidCatch, and render structure.
 *
 * @param options - Configuration for the error boundary
 * @returns A React class component
 *
 * @example
 * ```tsx
 * const DataErrorBoundary = createErrorBoundary({
 *   name: 'Data Loading Error',
 *   defaultMessage: 'An error occurred while loading data. Please try again.',
 *   retryButtonLabel: 'Retry',
 *   logPrefix: 'Data Error Boundary',
 * });
 * ```
 */
export function createErrorBoundary(options: CreateErrorBoundaryOptions) {
  const {
    name,
    defaultMessage,
    retryButtonLabel = 'Try Again',
    showReloadButton = false,
    logPrefix = 'Error Boundary',
  } = options;

  type Props = CreateErrorBoundaryProps;
  type State = CreateErrorBoundaryState;

  return class CreatedErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      if (import.meta.env.DEV) {
        console.error(`${logPrefix} caught an error:`, error, errorInfo);
      }
      this.props.onError?.(error, errorInfo);
    }

    handleReset = () => {
      this.setState({ hasError: false, error: null });
      this.props.onRetry?.();
    };

    render() {
      if (!this.state.hasError) {
        return this.props.children;
      }

      return (
        <div className="p-6">
          <Alert variant="danger" className="mb-4">
            <div className="flex items-start gap-3">
              <Icon name="alert-circle" className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">{name}</h3>
                <p className="text-sm text-red-700 mb-3">
                  {this.props.fallbackMessage ?? defaultMessage}
                </p>
                {this.state.error && import.meta.env.DEV && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">Error Details</summary>
                    <pre className="mt-2 text-xs text-red-800 bg-red-50 p-2 rounded overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </details>
                )}
                <div className={showReloadButton ? 'flex gap-2 mt-3' : 'mt-3'}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={this.handleReset}
                    icon={<Icon name="loading" />}
                  >
                    {retryButtonLabel}
                  </Button>
                  {showReloadButton && (
                    <Button
                      variant="cancel"
                      size="sm"
                      onClick={() => window.location.reload()}
                      icon={<Icon name="close" />}
                    >
                      Reload Page
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Alert>
        </div>
      );
    }
  };
}
