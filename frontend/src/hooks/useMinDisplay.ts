/**
 * useMinDisplay - Keeps a boolean true for at least minDisplayMs after it would go false.
 * Use for query-driven loading to avoid loader flicker when the API responds in &lt;50ms.
 * @module hooks/useMinDisplay
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Returns true while `value` is true, and remains true for at least `minDisplayMs`
 * after `value` becomes false.
 */
export function useMinDisplay(value: boolean, minDisplayMs: number): boolean {
  const [smoothed, setSmoothed] = useState(value);
  const becameFalseAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (value) {
      becameFalseAtRef.current = null;
      queueMicrotask(() => setSmoothed(true));
      return;
    }

    if (smoothed) {
      const now = Date.now();
      if (becameFalseAtRef.current === null) {
        becameFalseAtRef.current = now;
      }
      const elapsed = now - becameFalseAtRef.current;
      const remaining = Math.max(0, minDisplayMs - elapsed);
      if (remaining <= 0) {
        becameFalseAtRef.current = null;
        queueMicrotask(() => setSmoothed(false));
        return;
      }
      const timeoutId = setTimeout(() => {
        becameFalseAtRef.current = null;
        setSmoothed(false);
      }, remaining);
      return () => clearTimeout(timeoutId);
    }
  }, [value, minDisplayMs, smoothed]);

  return smoothed;
}
