/**
 * Tracks `document.visibilityState` so polling queries can pause when the tab is hidden.
 */

import { useEffect, useState } from 'react';

/**
 * @returns true when the document is visible (or during SSR).
 */
export function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(
    typeof document === 'undefined' ? true : document.visibilityState === 'visible'
  );

  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return visible;
}
