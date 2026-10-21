import { useCallback } from 'react';

type SetFilter = (key: string, value: unknown) => void;

/**
 * Wraps `setFilter` so list pages reset server pagination when filters change.
 */
export function useFilterChangeWithPageReset(setFilter: SetFilter, resetPage: () => void) {
  const setFilterAndReset = useCallback(
    (key: string, value: unknown) => {
      setFilter(key, value);
      resetPage();
    },
    [setFilter, resetPage],
  );

  return { setFilterAndReset };
}
