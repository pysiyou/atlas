/** Generic UI interaction hooks. */

import React, { useState, useCallback, useRef, useEffect, type RefObject } from 'react';
import type { UseAsyncActionOptions, LoadingStatus } from '@/components/feedback';

export function useAnchoredPopoverDismiss(
  containerRef: RefObject<HTMLElement | null>,
  setOpen: (open: boolean) => void
): void {
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      const container = containerRef.current;
      if (!container || !target) return;
      if (!container.contains(target)) setOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, setOpen]);
}

export function useDualHandleSlider(
  value: [number, number],
  onChange: (value: [number, number]) => void,
  minValue: number,
  maxValue: number
) {
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<'min' | 'max' | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const getPercentage = useCallback(
    (val: number) => ((val - minValue) / (maxValue - minValue)) * 100,
    [minValue, maxValue]
  );

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return 0;
      const rect = sliderRef.current.getBoundingClientRect();
      const percent = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      const rawValue = percent * (maxValue - minValue) + minValue;
      return Math.round(rawValue);
    },
    [minValue, maxValue]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;

      const newValue = getValueFromPosition(e.clientX);

      setLocalValue(prev => {
        const [currMin, currMax] = prev;
        if (isDragging.current === 'min') {
          const nextMin = Math.min(newValue, currMax);
          return [nextMin, currMax];
        }
        const nextMax = Math.max(newValue, currMin);
        return [currMin, nextMax];
      });
    },
    [getValueFromPosition]
  );

  const latestValueRef = useRef(localValue);
  useEffect(() => {
    latestValueRef.current = localValue;
  }, [localValue]);

  const mouseUpHandlerRef = useRef<() => void>(() => {});

  useEffect(() => {
    mouseUpHandlerRef.current = () => {
      if (isDragging.current) {
        onChange(latestValueRef.current);
      }
      isDragging.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', mouseUpHandlerRef.current);
    };
  }, [onChange, handleMouseMove]);

  const onMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = type;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', mouseUpHandlerRef.current);
  };

  return {
    localValue,
    sliderRef,
    getPercentage,
    onMouseDown,
  };
}

export interface UseAsyncActionReturn<T extends unknown[]> {
  execute: (...args: T) => Promise<void>;
  status: LoadingStatus;
  isPending: boolean;
  cancel: () => void;
  error: unknown;
}

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