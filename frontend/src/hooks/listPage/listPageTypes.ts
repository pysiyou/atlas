import type { ListViewPaginationConfig } from '@/components/data-table';

/** Loading shape shared by ListView and list chrome hooks. */
export interface ListPageChromeProps {
  loading?: boolean;
}

/** Server list pages: pagination from useServerListChrome. */
export type ListPageServerPagination = ListViewPaginationConfig & { mode: 'server' };
