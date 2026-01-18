/**
 * ErrorAlert Component
 * Displays error messages from context providers with retry functionality
 */

import React from 'react';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { RefreshCw } from 'lucide-react';

/**
 * Generic error type that matches all context error types
 */
interface ContextError {
  message: string;
  code?: string;
  operation?: string;
}

interface ErrorAlertProps {
  /** The error object from context */
  error: ContextError | null;
  /** Function to clear the error */
  onDismiss?: () => void;
  /** Function to retry the failed operation */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show retry button */
  showRetry?: boolean;
}

/**
 * ErrorAlert Component
 * Displays context errors with optional retry functionality
 * 
 * @example
 * ```tsx
 * const { error, clearError, refreshPatients } = usePatients();
 * 
 * <ErrorAlert 
 *   error={error}
 *   onDismiss={clearError}
 *   onRetry={refreshPatients}
 * />
 * ```
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onDismiss,
  onRetry,
  className = '',
  showRetry = true,
}) => {
  if (!error) return null;

  return (
    <Alert 
      variant="danger" 
      onClose={onDismiss}
      className={className}
    >
      <div className="flex flex-col gap-2">
        <div>
          <p className="font-medium">{error.message}</p>
          {error.operation && (
            <p className="text-sm opacity-80 mt-1">
              Failed operation: {error.operation}
            </p>
          )}
          {error.code && (
            <p className="text-xs opacity-60 mt-1">
              Error code: {error.code}
            </p>
          )}
        </div>
        {showRetry && onRetry && (
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Retry
            </Button>
          </div>
        )}
      </div>
    </Alert>
  );
};

/**
 * Inline error display for smaller contexts
 */
export const InlineError: React.FC<{
  error: ContextError | null;
  onDismiss?: () => void;
}> = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="text-red-600 text-sm flex items-center gap-2 p-2 bg-red-50 rounded">
      <span>{error.message}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
};
