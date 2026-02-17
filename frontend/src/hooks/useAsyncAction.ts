/**
 * useAsyncAction - Async action with cancellation, min display time, and optional scope registration.
 * Replaces useAsyncHandler for modal/button flows when cancellation or scope is needed.
 * @module hooks/useAsyncAction
 */

import { useState, useCallback, useRef, useEffect, useId } from 'react';
import type { UseAsyncActionOptions } from '@/shared/loading/types';
import type { LoadingStatus } from '@/shared/loading/types';
import { useLoadingScopeActions } from '@/shared/loading';

export interface UseAsyncActionReturn<T extends unknown[]> {
  execute: (...args: T) => Promise<void>;
  status: LoadingStatus;
  isPending: boolean;
  cancel: () => void;
  error: unknown;
}

/**
 * Handler receives AbortSignal as first argument; new execute() aborts previous run.
 * When scope is 'global' or 'section', registers with LoadingScopeContext for the duration of the run.
 */
export function useAsyncAction<T extends unknown[]>(
  handler: (signal: AbortSignal, ...args: T) => void | Promise<void>,
  options: UseAsyncActionOptions = {}
): UseAsyncActionReturn<T> {
  const { minDisplayMs = 0, scope = 'inline', scopeId, onError } = options;

  const id = useId();
  const { register, unregister } = useLoadingScopeActions();

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
      if (scope === 'global' || scope === 'section') {
        unregister(scope, scope === 'section' ? scopeId : undefined, id);
      }
      setStatus(newStatus);
      setError(err ?? null);
    },
    [clearMinDisplayTimeout, scope, scopeId, id, unregister]
  );

  const execute = useCallback(
    async (...args: T): Promise<void> => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      const controller = new AbortController();
      controllerRef.current = controller;
      const start = Date.now();

      if (scope === 'global' || scope === 'section') {
        register(scope, scope === 'section' ? scopeId : undefined, id);
      }
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
    [handler, minDisplayMs, scope, scopeId, id, register, finishRun, onError]
  );

  const cancel = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    clearMinDisplayTimeout();
    if (status === 'pending') {
      if (scope === 'global' || scope === 'section') {
        unregister(scope, scope === 'section' ? scopeId : undefined, id);
      }
      setStatus('idle');
      setError(null);
    }
  }, [status, scope, scopeId, id, unregister, clearMinDisplayTimeout]);

  useEffect(() => {
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
      clearMinDisplayTimeout();
      if (scope === 'global' || scope === 'section') {
        unregister(scope, scope === 'section' ? scopeId : undefined, id);
      }
    };
  }, [scope, scopeId, id, unregister, clearMinDisplayTimeout]);

  const isPending = status === 'pending';

  return { execute, status, isPending, cancel, error };
}
