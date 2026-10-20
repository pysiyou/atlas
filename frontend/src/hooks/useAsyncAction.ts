/**
 * useAsyncAction - Async action with cancellation and optional minimum pending display time.
 * @module hooks/useAsyncAction
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { UseAsyncActionOptions, LoadingStatus } from '@/components/loaders';

export interface UseAsyncActionReturn<T extends unknown[]> {
  execute: (...args: T) => Promise<void>;
  status: LoadingStatus;
  isPending: boolean;
  cancel: () => void;
  error: unknown;
}

/**
 * Handler receives AbortSignal as first argument; new execute() aborts the previous run.
 */
export function useAsyncAction<T extends unknown[]>(
  handler: (signal: AbortSignal, ...args: T) => void | Promise<void>,
  options: UseAsyncActionOptions = {}
): UseAsyncActionReturn<T> {
  const { minDisplayMs = 0, onError } = options;

  const [status, setStatus] = useState<LoadingStatus>('idle');
  const [error, setError] = useState<unknown>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const minDisplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearMinDisplayTimeout = useCallback(() => {
    if (minDisplayTimeoutRef.current) {
      clearTimeout(minDisplayTimeoutRef.current);
      minDisplayTimeoutRef.current = null;
    }
  }, []);

  const finishRun = useCallback(
    (newStatus: LoadingStatus, err?: unknown) => {
      clearMinDisplayTimeout();
      setStatus(newStatus);
      setError(err ?? null);
    },
    [clearMinDisplayTimeout]
  );

  const execute = useCallback(
    async (...args: T): Promise<void> => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      const controller = new AbortController();
      controllerRef.current = controller;
      const start = Date.now();

      setStatus('pending');
      setError(null);

      try {
        const result = handler(controller.signal, ...args);
        await (typeof result?.then === 'function' ? result : Promise.resolve());
        if (controller.signal.aborted) return;

        const elapsed = Date.now() - start;
        const remaining = Math.max(0, minDisplayMs - elapsed);
        if (remaining > 0) {
          minDisplayTimeoutRef.current = setTimeout(() => {
            minDisplayTimeoutRef.current = null;
            finishRun('success');
          }, remaining);
        } else {
          finishRun('success');
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        onError?.(err);
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, minDisplayMs - elapsed);
        if (remaining > 0) {
          minDisplayTimeoutRef.current = setTimeout(() => {
            minDisplayTimeoutRef.current = null;
            finishRun('error', err);
          }, remaining);
        } else {
          finishRun('error', err);
        }
      }
    },
    [handler, minDisplayMs, finishRun, onError]
  );

  const cancel = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    clearMinDisplayTimeout();
    if (status === 'pending') {
      setStatus('idle');
      setError(null);
    }
  }, [status, clearMinDisplayTimeout]);

  useEffect(() => {
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
      clearMinDisplayTimeout();
    };
  }, [clearMinDisplayTimeout]);

  const isPending = status === 'pending';

  return { execute, status, isPending, cancel, error };
}
