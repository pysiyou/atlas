/**
 * Feedback Components — loading, error, toasts (max-depth-1).
 */

export { AppToastBar, toast } from './AppToastBar';
export type { ToastMessageObject } from './AppToastBar';
export { DataLoader } from './DataLoader';
export { ErrorAlert } from './ErrorAlert';
export { LoadingState } from './LoadingState';
export type { LoadingStateProps } from './LoadingState';
export { ErrorBoundary } from './ErrorBoundary';
export { ErrorFallback } from './ErrorFallback';
export type { ErrorFallbackProps } from './ErrorFallback';
export { LoadingScopeProvider } from './LoadingScopeContext';
export {
  useIsGlobalLoading,
  useIsSectionLoading,
  useLoadingScopeActions,
} from './loadingScopeHooks';
export { SectionLoadingBoundary } from './SectionLoadingBoundary';
export type { SectionLoadingBoundaryProps } from './SectionLoadingBoundary';
export type { LoadingScope, LoadingStatus, UseAsyncActionOptions } from './loadingTypes';
