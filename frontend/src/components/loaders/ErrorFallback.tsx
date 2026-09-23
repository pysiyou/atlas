/**
 * Shared error fallback UI for error boundaries.
 */

import { actionButtonPreset, Button, Icon } from '@/components';
import { ICONS } from '@/config/icons';

import { ERROR_SURFACE_TYPE, RADIUS, SHADOW, TONE } from '@/components/theme/recipes';

export interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
  homeHref?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  homeHref = '/',
}) => (
  <div className="min-h-screen flex items-center justify-center bg-surface-page px-space-4">
    <div className={`max-w-md w-full bg-surface ${RADIUS.menu} ${SHADOW.overlay} p-space-6`}>
      <div className="flex items-center justify-start gap-space-3">
        <div className={`flex shrink-0 items-center justify-center w-12 h-12 ${RADIUS.pill}`}>
          <Icon name={ICONS.actions.alertCircle} className={`w-6 h-6 ${TONE.danger.fg}`} />
        </div>
        <h2 className={ERROR_SURFACE_TYPE.title}>Something went wrong</h2>
      </div>
      <p className={`mt-space-2 ${ERROR_SURFACE_TYPE.message}`}>
        We're sorry, but something unexpected happened. Please try refreshing the page.
      </p>
      {import.meta.env.DEV && error && (
        <div className={`mt-space-4 p-space-3 bg-surface-hover ${RADIUS.field} ${ERROR_SURFACE_TYPE.code} overflow-auto max-h-40`}>
          <p className="font-normal mb-space-1">Error Details:</p>
          <p>{error.message}</p>
          {error.stack && <pre className={`mt-space-2 ${ERROR_SURFACE_TYPE.code} whitespace-pre-wrap`}>{error.stack}</pre>}
        </div>
      )}
      <div className="mt-space-6 flex gap-space-3">
        <Button onClick={onRetry} {...actionButtonPreset('retry')} size="md" className="flex-1">Try Again</Button>
        <Button
          onClick={() => (window.location.href = homeHref)}
          {...actionButtonPreset('home')}
          size="md"
          className="flex-1"
        >
          Go Home
        </Button>
      </div>
    </div>
  </div>
);
