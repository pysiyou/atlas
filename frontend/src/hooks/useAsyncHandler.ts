/**
 * useAsyncHandler - Reusable async action handler with loading state and optional min display time
 *
 * Use for modal/popover primary actions (approve, save, submit) to:
 * - Expose isPending for Button disabled + isLoading
 * - Optionally enforce a minimum display time to avoid loading flicker on fast requests
 * - Clear loading on both success and error (via finally)
 *
 * @module hooks/useAsyncHandler
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseAsyncHandlerOptions {
  /** Minimum time (ms) to show loading state; avoids flicker for fast requests. Default 0. */
  minDisplayMs?: number;
  /** Called when the async action throws. */
  onError?: (error: unknown) => void;
}

export interface UseAsyncHandlerReturn<T extends unknown[]> {
  /** Execute the async handler. Pass-through arguments. */
  execute: (...args: T) => Promise<void>;
  /** True from start of execute until after handler (and optional minDisplayMs) completes. */
  isPending: boolean;
}

/**
 * Wraps an async handler with isPending state and optional minimum display time.
 * Handler can be () => void | Promise<void>; execute always returns a Promise.
 */
export function useAsyncHandler<T extends unknown[]>(
  handler: (...args: T) => void | Promise<void>,
  options: UseAsyncHandlerOptions = {}
): UseAsyncHandlerReturn<T> {
  const { minDisplayMs = 0, onError } = options;
  const [isPending, setIsPending] = useState(false);
  const minDisplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const execute = useCallback(
    async (...args: T): Promise<void> => {
      setIsPending(true);
      const start = Date.now();

      try {
        const result = handler(...args);
        await (typeof result?.then === 'function' ? result : Promise.resolve());
      } catch (error) {
        onError?.(error);
      } finally {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, minDisplayMs - elapsed);
        if (remaining > 0) {
          minDisplayTimeoutRef.current = setTimeout(() => {
            minDisplayTimeoutRef.current = null;
            setIsPending(false);
          }, remaining);
        } else {
          setIsPending(false);
        }
      }
    },
    [handler, minDisplayMs, onError]
  );

  useEffect(() => {
    return () => {
      if (minDisplayTimeoutRef.current) {
        clearTimeout(minDisplayTimeoutRef.current);
      }
    };
  }, []);

  return { execute, isPending };
}
