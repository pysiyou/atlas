/**
 * Pagination page index that resets when filter snapshot or initial page changes.
 */

import { useCallback, useState, type SetStateAction } from 'react';

export function useResettablePage(
  initialPage: number,
  filterSnapshot: string
): [number, (action: SetStateAction<number>) => void] {
  const resetKey = `${filterSnapshot}\0${initialPage}`;
  const [state, setState] = useState({ resetKey, page: initialPage });

  if (state.resetKey !== resetKey) {
    setState({ resetKey, page: initialPage });
  }

  const setPage = useCallback((action: SetStateAction<number>) => {
    setState(current => ({
      ...current,
      page: typeof action === 'function' ? action(current.page) : action,
    }));
  }, []);

  return [state.page, setPage];
}
