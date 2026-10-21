/**
 * Shared types for async action loading state (local button/modal pending UI).
 */

export type LoadingStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseAsyncActionOptions {
  minDisplayMs?: number;
  onError?: (error: unknown) => void;
}
