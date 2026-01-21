/**
 * Feature Error Boundary Component
 * A smaller error boundary for feature-level error handling
 * Shows inline error UI instead of full-page error
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { logger } from '@/utils/logger';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';

interface FeatureErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Name of the feature for error logging */
  featureName?: string;
  /** Custom fallback UI */
  fallback?: ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show the "Go Home" button */
  showHomeButton?: boolean;
}

interface FeatureErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * FeatureErrorBoundary
 * Catches errors within a feature and displays an inline error message
 * Allows users to retry or navigate away without losing the entire page
 */
export class FeatureErrorBoundary extends Component<
  FeatureErrorBoundaryProps,
  FeatureErrorBoundaryState
> {
  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): FeatureErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { featureName = 'Unknown Feature', onError } = this.props;

    // Log error with feature context
    logger.error(`Error in ${featureName}`, error, {
      featureName,
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    const { children, fallback, featureName = 'this feature', showHomeButton = true } = this.props;
    const { hasError, error } = this.state;

    if (hasError) {
      // Custom fallback UI if provided
      if (fallback) {
        return fallback;
      }

      // Default inline error UI
      return (
        <div className="p-6">
          <Alert variant="danger" className="max-w-2xl mx-auto">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  Error loading {featureName}
                </h3>
                <p className="text-sm mt-1 opacity-80">
                  Something went wrong while loading this section. Please try again.
                </p>
              </div>

              {/* Show error details in development */}
              {import.meta.env.DEV && error && (
                <div className="bg-red-100 rounded p-3 text-xs font-mono overflow-auto max-h-32">
                  <p className="font-semibold mb-1">Error:</p>
                  <p>{error.message}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  variant="retry"
                  size="sm"
                >
                  Try Again
                </Button>
                {showHomeButton && (
                  <Button
                    onClick={() => window.location.href = '/dashboard'}
                    variant="back"
                    size="sm"
                  >
                    Go to Dashboard
                  </Button>
                )}
              </div>
            </div>
          </Alert>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap a component with FeatureErrorBoundary
 */
export function withFeatureErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  featureName: string
): React.FC<P> {
  return function WithFeatureErrorBoundary(props: P) {
    return (
      <FeatureErrorBoundary featureName={featureName}>
        <WrappedComponent {...props} />
      </FeatureErrorBoundary>
    );
  };
}
