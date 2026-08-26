/**
 * Prevents lab card click handlers from firing when interacting with nested controls.
 */

import { useCallback } from 'react';

const INTERACTIVE_SELECTOR =
  'button, input, form, textarea, select, a, [data-popover-content]';

export function useLabCardClickGuard(onClick: () => void) {
  return useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        const target = e.target as HTMLElement;
        if (target.closest(INTERACTIVE_SELECTOR)) {
          return;
        }
      }
      onClick();
    },
    [onClick]
  );
}
