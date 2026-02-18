/** Scope of loading: global, section, or inline. */
export type LoadingScope = 'global' | 'section' | 'inline';

export type LoadingStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseAsyncActionOptions {
  minDisplayMs?: number;
  scope?: LoadingScope;
  scopeId?: string;
  onError?: (error: unknown) => void;
}
