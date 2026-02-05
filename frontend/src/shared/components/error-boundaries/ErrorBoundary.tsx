/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { logger } from '@/utils/logger';
import { Button } from '@/shared/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to monitoring service
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
          <div className="max-w-md w-full bg-surface rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-danger-bg-strong rounded-full">
              <svg
                className="w-6 h-6 text-danger-text"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="mt-4 text-xl font-semibold text-center text-text">
              Something went wrong
            </h2>

            <p className="mt-2 text-sm text-center text-text-3">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mt-4 p-3 bg-neutral-100 rounded text-xs font-mono text-text overflow-auto max-h-40">
                <p className="font-semibold mb-1">Error Details:</p>
                <p>{this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="mt-2 text-xs whitespace-pre-wrap">{this.state.error.stack}</pre>
                )}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button onClick={this.handleReset} variant="retry" size="md" className="flex-1">
                Try Again
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="back"
                size="md"
                className="flex-1"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
