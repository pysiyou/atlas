/**
 * Shared error fallback UI used by all error boundaries.
 * Single full-page layout: icon, title, message, dev details, Try Again + Go Home.
 */

import { Button, Icon } from '@/shared/ui';
import { ICONS } from '@/utils';

export interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
  /** Target for "Go Home" button (default '/') */
  homeHref?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  homeHref = '/',
}) => (
  <div className="min-h-screen flex items-center justify-center bg-surface-page px-4">
    <div className="max-w-md w-full bg-surface rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-start gap-3">
        <div className="flex shrink-0 items-center justify-center w-12 h-12 rounded-full">
          <Icon name={ICONS.actions.alertCircle} className="w-6 h-6 text-danger-fg" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary">
          Something went wrong
        </h2>
      </div>

      <p className="mt-2 text-sm text-center text-text-tertiary">
        We're sorry, but something unexpected happened. Please try refreshing the page.
      </p>

      {import.meta.env.DEV && error && (
        <div className="mt-4 p-3 bg-neutral-100 rounded text-xs font-mono text-text-primary overflow-auto max-h-40">
          <p className="font-normal mb-1">Error Details:</p>
          <p>{error.message}</p>
          {error.stack && (
            <pre className="mt-2 text-xs whitespace-pre-wrap">{error.stack}</pre>
          )}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button onClick={onRetry} variant="retry" size="md" className="flex-1">
          Try Again
        </Button>
        <Button
          onClick={() => (window.location.href = homeHref)}
          variant="home"
          size="md"
          className="flex-1"
        >
          Go Home
        </Button>
      </div>
    </div>
  </div>
);
