import { useCallback, useState } from 'react';

import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';

/** Local page size for server-paginated lists (drives API `pageSize` + footer select). */
export function usePaginatedPageSize(initialPageSize = DEFAULT_LIST_PAGE_SIZE) {
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
  }, []);

  return { pageSize, setPageSize };
}
