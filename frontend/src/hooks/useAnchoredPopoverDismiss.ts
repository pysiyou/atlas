/**
 * Dismiss an anchored search popover on outside pointer or Escape.
 */
import { useEffect, type RefObject } from 'react';

/**
 * Closes an anchored popover when the user clicks/taps outside the owner
 * element or presses Escape. `setOpen` should be a stable React state setter.
 *
 * @param containerRef - Element that owns the trigger and results panel
 * @param setOpen - Open-state setter; always called with `false` on dismiss
 */
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
