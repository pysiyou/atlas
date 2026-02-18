/**
 * Loading state architecture: types for scope, status, and options.
 * @module shared/loading/types
 */

/** Scope of loading: global (full-screen), section (local area), or inline (button/row only). */
export type LoadingScope = 'global' | 'section' | 'inline';

/** Status of an async action run. */
export type LoadingStatus = 'idle' | 'pending' | 'success' | 'error';

/** Options for async actions: min display time and scope registration. */
export interface UseAsyncActionOptions {
  /** Minimum time (ms) to show loading; avoids flicker. Default 0. */
  minDisplayMs?: number;
  /** Scope for loading UI. Default 'inline'. */
  scope?: LoadingScope;
  /** Required when scope is 'section'; ignored for 'inline'/'global'. */
  scopeId?: string;
  /** Called when the async action throws. */
  onError?: (error: unknown) => void;
}
